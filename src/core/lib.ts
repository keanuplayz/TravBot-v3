import {GenericWrapper, NumberWrapper, StringWrapper, ArrayWrapper} from "./wrappers";
import {Client, Message, TextChannel, DMChannel, NewsChannel, Guild, User, GuildMember, Permissions} from "discord.js";
import chalk from "chalk";
import {get} from "https";
import FileManager from "./storage";
import {eventListeners} from "../events/messageReactionRemove";
import {client} from "../index";
import {EmoteRegistryDump, EmoteRegistryDumpEntry} from "./structures";

/** A type that describes what the library module does. */
export interface CommonLibrary {
    // Wrapper Object //
    /** Wraps the value you enter with an object that provides extra functionality and provides common utility functions. */
    (value: number): NumberWrapper;
    (value: string): StringWrapper;
    <T>(value: T[]): ArrayWrapper<T>;
    <T>(value: T): GenericWrapper<T>;

    // Common Library Functions //
    /** <Promise>.catch($.handler.bind($)) or <Promise>.catch(error => $.handler(error)) */
    handler: (error: Error) => void;
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    ready: (...args: any[]) => void;
    paginate: (
        message: Message,
        senderID: string,
        total: number,
        callback: (page: number) => void,
        duration?: number
    ) => void;
    prompt: (message: Message, senderID: string, onConfirm: () => void, duration?: number) => void;
    getMemberByUsername: (guild: Guild, username: string) => Promise<GuildMember | undefined>;
    callMemberByUsername: (
        message: Message,
        username: string,
        onSuccess: (member: GuildMember) => void
    ) => Promise<void>;
    ask: (
        message: Message,
        senderID: string,
        condition: (reply: string) => boolean,
        onSuccess: () => void,
        onReject: () => string,
        timeout?: number
    ) => void;
    askYesOrNo: (message: Message, senderID: string, onSuccess: (condition: boolean) => void, timeout?: number) => void;
    askMultipleChoice: (
        message: Message,
        senderID: string,
        callbackStack: (() => void)[] | ((choice: number) => void)
    ) => void;

    // Dynamic Properties //
    args: any[];
    client: Client;
    message: Message;
    channel: TextChannel | DMChannel | NewsChannel;
    guild: Guild | null;
    author: User;
    member: GuildMember | null;
}

export default function $(value: number): NumberWrapper;
export default function $(value: string): StringWrapper;
export default function $<T>(value: T[]): ArrayWrapper<T>;
export default function $<T>(value: T): GenericWrapper<T>;
export default function $(value: any) {
    if (isType(value, Number)) return new NumberWrapper(value);
    else if (isType(value, String)) return new StringWrapper(value);
    else if (isType(value, Array)) return new ArrayWrapper(value);
    else return new GenericWrapper(value);
}

// If you use promises, use this function to display the error in chat.
// Case #1: await $.channel.send(""); --> Automatically caught by Command.execute().
// Case #2: $.channel.send("").catch($.handler.bind($)); --> Manually caught by the user.
$.handler = function (this: CommonLibrary, error: Error) {
    if (this)
        this.channel.send(
            `There was an error while trying to execute that command!\`\`\`${error.stack ?? error}\`\`\``
        );
    else
        $.warn(
            "No context was attached to $.handler! Make sure to use .catch($.handler.bind($)) or .catch(error => $.handler(error)) instead!"
        );

    $.error(error);
};

// Logs with different levels of verbosity.
export const logs: {[type: string]: string} = {
    error: "",
    warn: "",
    info: "",
    verbose: ""
};

let enabled = true;

export function setConsoleActivated(activated: boolean) {
    enabled = activated;
}

// The custom console. In order of verbosity, error, warn, log, and debug. Ready is a variation of log.
// General Purpose Logger
$.log = (...args: any[]) => {
    if (enabled) console.log(chalk.white.bgGray(formatTimestamp()), chalk.black.bgWhite("INFO"), ...args);

    const text = `[${formatUTCTimestamp()}] [INFO] ${args.join(" ")}\n`;
    logs.info += text;
    logs.verbose += text;
};
// "It'll still work, but you should really check up on this."
$.warn = (...args: any[]) => {
    if (enabled) console.warn(chalk.white.bgGray(formatTimestamp()), chalk.black.bgYellow("WARN"), ...args);

    const text = `[${formatUTCTimestamp()}] [WARN] ${args.join(" ")}\n`;
    logs.warn += text;
    logs.info += text;
    logs.verbose += text;
};
// Used for anything which prevents the program from actually running.
$.error = (...args: any[]) => {
    if (enabled) console.error(chalk.white.bgGray(formatTimestamp()), chalk.white.bgRed("ERROR"), ...args);

    const text = `[${formatUTCTimestamp()}] [ERROR] ${args.join(" ")}\n`;
    logs.error += text;
    logs.warn += text;
    logs.info += text;
    logs.verbose += text;
};
// Be as verbose as possible. If anything might help when debugging an error, then include it. This only shows in your console if you run this with "dev", but you can still get it from "logs.verbose".
// $.debug(`core/lib::parseArgs("testing \"in progress\"") = ["testing", "in progress"]`) --> <path>/::(<object>.)<function>(<args>) = <value>
// Would probably be more suited for debugging program logic rather than function logic, which can be checked using unit tests.
$.debug = (...args: any[]) => {
    if (process.argv[2] === "dev" && enabled)
        console.debug(chalk.white.bgGray(formatTimestamp()), chalk.white.bgBlue("DEBUG"), ...args);

    const text = `[${formatUTCTimestamp()}] [DEBUG] ${args.join(" ")}\n`;
    logs.verbose += text;
};
// Used once at the start of the program when the bot loads.
$.ready = (...args: any[]) => {
    if (enabled) console.log(chalk.white.bgGray(formatTimestamp()), chalk.black.bgGreen("READY"), ...args);

    const text = `[${formatUTCTimestamp()}] [READY] ${args.join(" ")}\n`;
    logs.info += text;
    logs.verbose += text;
};

export function formatTimestamp(now = new Date()) {
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");
    const second = now.getSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export function formatUTCTimestamp(now = new Date()) {
    const year = now.getUTCFullYear();
    const month = (now.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = now.getUTCDate().toString().padStart(2, "0");
    const hour = now.getUTCHours().toString().padStart(2, "0");
    const minute = now.getUTCMinutes().toString().padStart(2, "0");
    const second = now.getUTCSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export function botHasPermission(guild: Guild | null, permission: number): boolean {
    return !!(client.user && guild?.members.resolve(client.user)?.hasPermission(permission));
}

export function updateGlobalEmoteRegistry(): void {
    const data: EmoteRegistryDump = {version: 1, list: []};

    for (const guild of client.guilds.cache.values()) {
        for (const emote of guild.emojis.cache.values()) {
            data.list.push({
                ref: emote.name,
                id: emote.id,
                name: emote.name,
                requires_colons: emote.requiresColons || false,
                animated: emote.animated,
                url: emote.url,
                guild_id: emote.guild.name,
                guild_name: emote.guild.name
            });
        }
    }

    FileManager.write("emote-registry", data, true);
}

// Pagination function that allows for customization via a callback.
// Define your own pages outside the function because this only manages the actual turning of pages.
$.paginate = async (
    message: Message,
    senderID: string,
    total: number,
    callback: (page: number) => void,
    duration = 60000
) => {
    let page = 0;
    const turn = (amount: number) => {
        page += amount;

        if (page < 0) page += total;
        else if (page >= total) page -= total;

        callback(page);
    };
    const handle = (emote: string, reacterID: string) => {
        switch (emote) {
            case "⬅️":
                turn(-1);
                break;
            case "➡️":
                turn(1);
                break;
        }
    };

    // Listen for reactions and call the handler.
    await message.react("⬅️");
    await message.react("➡️");
    eventListeners.set(message.id, handle);
    await message.awaitReactions(
        (reaction, user) => {
            if (user.id === senderID) {
                // The reason this is inside the call is because it's possible to switch a user's permissions halfway and suddenly throw an error.
                // This will dynamically adjust for that, switching modes depending on whether it currently has the "Manage Messages" permission.
                const canDeleteEmotes = botHasPermission(message.guild, Permissions.FLAGS.MANAGE_MESSAGES);
                handle(reaction.emoji.name, user.id);

                if (canDeleteEmotes) reaction.users.remove(user);
            }

            return false;
        },
        {time: duration}
    );
    // When time's up, remove the bot's own reactions.
    eventListeners.delete(message.id);
    message.reactions.cache.get("⬅️")?.users.remove(message.author);
    message.reactions.cache.get("➡️")?.users.remove(message.author);
};

// Waits for the sender to either confirm an action or let it pass (and delete the message).
// This should probably be renamed to "confirm" now that I think of it, "prompt" is better used elsewhere.
// Append "\n*(This message will automatically be deleted after 10 seconds.)*" in the future?
$.prompt = async (message: Message, senderID: string, onConfirm: () => void, duration = 10000) => {
    let isDeleted = false;

    message.react("✅");
    await message.awaitReactions(
        (reaction, user) => {
            if (user.id === senderID) {
                if (reaction.emoji.name === "✅") {
                    onConfirm();
                    isDeleted = true;
                    message.delete();
                }
            }

            // CollectorFilter requires a boolean to be returned.
            // My guess is that the return value of awaitReactions can be altered by making a boolean filter.
            // However, because that's not my concern with this command, I don't have to worry about it.
            // May as well just set it to false because I'm not concerned with collecting any reactions.
            return false;
        },
        {time: duration}
    );

    if (!isDeleted) message.delete();
};

// A list of "channel-message" and callback pairs. Also, I imagine that the callback will be much more maintainable when discord.js v13 comes out with a dedicated message.referencedMessage property.
// Also, I'm defining it here instead of the message event because the load order screws up if you export it from there. Yeah... I'm starting to notice just how much technical debt has been built up. The command handler needs to be modularized and refactored sooner rather than later. Define all constants in one area then grab from there.
export const replyEventListeners = new Map<string, (message: Message) => void>();

// Asks the user for some input using the inline reply feature. The message here is a message you send beforehand.
// If the reply is rejected, reply with an error message (when stable support comes from discord.js).
// Append "\n*(Note: Make sure to use Discord's inline reply feature or this won't work!)*" in the future? And also the "you can now reply to this message" edit.
$.ask = async (
    message: Message,
    senderID: string,
    condition: (reply: string) => boolean,
    onSuccess: () => void,
    onReject: () => string,
    timeout = 60000
) => {
    const referenceID = `${message.channel.id}-${message.id}`;

    replyEventListeners.set(referenceID, (reply) => {
        if (reply.author.id === senderID) {
            if (condition(reply.content)) {
                onSuccess();
                replyEventListeners.delete(referenceID);
            } else {
                reply.reply(onReject());
            }
        }
    });

    setTimeout(() => {
        replyEventListeners.set(referenceID, (reply) => {
            reply.reply("that action timed out, try using the command again");
            replyEventListeners.delete(referenceID);
        });
    }, timeout);
};

$.askYesOrNo = async (message: Message, senderID: string, onSuccess: (condition: boolean) => void, timeout = 30000) => {
    let isDeleted = false;

    await message.react("✅");
    message.react("❌");
    await message.awaitReactions(
        (reaction, user) => {
            if (user.id === senderID) {
                const isCheckReacted = reaction.emoji.name === "✅";

                if (isCheckReacted || reaction.emoji.name === "❌") {
                    onSuccess(isCheckReacted);
                    isDeleted = true;
                    message.delete();
                }
            }

            return false;
        },
        {time: timeout}
    );

    if (!isDeleted) message.delete();
};

// This MUST be split into an array. These emojis are made up of several characters each, adding up to 29 in length.
const multiNumbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

// This will bring up an option to let the user choose between one option out of many.
$.askMultipleChoice = async (message: Message, senderID: string, callbackStack: (() => void)[], timeout = 90000) => {
    let isDeleted = false;

    for (let i = 0; i < callbackStack.length; i++) {
        await message.react(multiNumbers[i]);
    }

    await message.awaitReactions(
        (reaction, user) => {
            if (user.id === senderID) {
                const index = multiNumbers.indexOf(reaction.emoji.name);

                if (index !== -1) {
                    callbackStack[index]();
                    isDeleted = true;
                    message.delete();
                }
            }

            return false;
        },
        {time: timeout}
    );

    if (!isDeleted) message.delete();
};

$.getMemberByUsername = async (guild: Guild, username: string) => {
    return (
        await guild.members.fetch({
            query: username,
            limit: 1
        })
    ).first();
};

/** Convenience function to handle false cases automatically. */
$.callMemberByUsername = async (message: Message, username: string, onSuccess: (member: GuildMember) => void) => {
    const guild = message.guild;
    const send = message.channel.send;

    if (guild) {
        const member = await $.getMemberByUsername(guild, username);

        if (member) onSuccess(member);
        else send(`Couldn't find a user by the name of \`${username}\`!`);
    } else send("You must execute this command in a server!");
};

/**
 * Splits a command by spaces while accounting for quotes which capture string arguments.
 * - `\"` = `"`
 * - `\\` = `\`
 */
export function parseArgs(line: string): string[] {
    let result = [];
    let selection = "";
    let inString = false;
    let isEscaped = false;

    for (let c of line) {
        if (isEscaped) {
            if (['"', "\\"].includes(c)) selection += c;
            else selection += "\\" + c;

            isEscaped = false;
        } else if (c === "\\") isEscaped = true;
        else if (c === '"') inString = !inString;
        else if (c === " " && !inString) {
            result.push(selection);
            selection = "";
        } else selection += c;
    }

    if (selection.length > 0) result.push(selection);

    return result;
}

/**
 * Allows you to store a template string with variable markers and parse it later.
 * - Use `%name%` for variables
 * - `%%` = `%`
 * - If the invalid token is null/undefined, nothing is changed.
 */
export function parseVars(line: string, definitions: {[key: string]: string}, invalid: string | null = ""): string {
    let result = "";
    let inVariable = false;
    let token = "";

    for (const c of line) {
        if (c === "%") {
            if (inVariable) {
                if (token === "") result += "%";
                else {
                    if (token in definitions) result += definitions[token];
                    else if (invalid === null) result += `%${token}%`;
                    else result += invalid;

                    token = "";
                }
            }

            inVariable = !inVariable;
        } else if (inVariable) token += c;
        else result += c;
    }

    return result;
}

export function isType(value: any, type: any): boolean {
    if (value === undefined && type === undefined) return true;
    else if (value === null && type === null) return true;
    else return value !== undefined && value !== null && value.constructor === type;
}

/**
 * Checks a value to see if it matches the fallback's type, otherwise returns the fallback.
 * For the purposes of the templates system, this function will only check array types, objects should be checked under their own type (as you'd do anyway with something like a User object).
 * If at any point the value doesn't match the data structure provided, the fallback is returned.
 * Warning: Type checking is based on the fallback's type. Be sure that the "type" parameter is accurate to this!
 */
export function select<T>(value: any, fallback: T, type: Function, isArray = false): T {
    if (isArray && isType(value, Array)) {
        for (let item of value) if (!isType(item, type)) return fallback;
        return value;
    } else {
        if (isType(value, type)) return value;
        else return fallback;
    }
}

export function clean(text: any) {
    if (typeof text === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else return text;
}

export function trimArray(arr: any, maxLen = 10) {
    if (arr.length > maxLen) {
        const len = arr.length - maxLen;
        arr = arr.slice(0, maxLen);
        arr.push(`${len} more...`);
    }
    return arr;
}

export function formatBytes(bytes: any) {
    if (bytes === 0) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

export function getContent(url: any) {
    return new Promise((resolve, reject) => {
        get(url, (res: {resume?: any; setEncoding?: any; on?: any; statusCode?: any}) => {
            const {statusCode} = res;
            if (statusCode !== 200) {
                res.resume();
                reject(`Request failed. Status code: ${statusCode}`);
            }
            res.setEncoding("utf8");
            let rawData = "";
            res.on("data", (chunk: string) => {
                rawData += chunk;
            });
            res.on("end", () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } catch (e) {
                    reject(`Error: ${e.message}`);
                }
            });
        }).on("error", (err: {message: any}) => {
            reject(`Error: ${err.message}`);
        });
    });
}

export interface GenericJSON {
    [key: string]: any;
}

export abstract class GenericStructure {
    private __meta__ = "generic";

    constructor(tag?: string) {
        this.__meta__ = tag || this.__meta__;
    }

    public save(asynchronous = true) {
        const tag = this.__meta__;
        /// @ts-ignore
        delete this.__meta__;
        FileManager.write(tag, this, asynchronous);
        this.__meta__ = tag;
    }
}

// A 50% chance would be "Math.random() < 0.5" because Math.random() can be [0, 1), so to make two equal ranges, you'd need [0, 0.5)U[0.5, 1).
// Similar logic would follow for any other percentage. Math.random() < 1 is always true (100% chance) and Math.random() < 0 is always false (0% chance).
export const Random = {
    num: (min: number, max: number) => Math.random() * (max - min) + min,
    int: (min: number, max: number) => Math.floor(Random.num(min, max)),
    chance: (decimal: number) => Math.random() < decimal,
    sign: (number = 1) => number * (Random.chance(0.5) ? -1 : 1),
    deviation: (base: number, deviation: number) => Random.num(base - deviation, base + deviation)
};
