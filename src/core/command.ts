import {parseVars} from "./lib";
import {Collection, Client, Message, TextChannel, DMChannel, NewsChannel, Guild, User, GuildMember} from "discord.js";
import {getPrefix} from "../core/structures";
import glob from "glob";

export enum CHANNEL_TYPE {
    BOTH,
    GUILD,
    DM
}

// **Notice**
// Now that I've tried it out, this turned out to be a pretty bad idea in the amount of time spent, the decrease of flexibility, and the maintainability of the code. It's not even worth doing this.

interface CommandMenuBase {
    args: any[];
    client: Client;
    message: Message;
    author: User;
    // According to the documentation, a message can be part of a guild while also not having a
    // member object for the author. This will happen if the author of a message left the guild.
    member: GuildMember | null;
}

interface CommandMenuBoth extends CommandMenuBase {
    channel: TextChannel | DMChannel | NewsChannel;
    guild: Guild | null;
}

interface CommandMenuGuild extends CommandMenuBase {
    channel: TextChannel | NewsChannel;
    guild: Guild;
}

// If it's a DM, the guild must be null and the channel type must be DM (single user). Although there is a Group DM type on Discord's API, it will always be invalid for bots. It can never be a group DM because you need to be friends with a user to add them to a group DM and you cannot friend bots.
interface CommandMenuDM extends CommandMenuBase {
    channel: DMChannel;
    guild: null;
}

type CommandMenu = CommandMenuBoth | CommandMenuGuild | CommandMenuDM;

interface CommandOptionsBase {
    description?: string;
    endpoint?: boolean;
    usage?: string;
    permission?: number;
    aliases?: string[];
    subcommands?: {[key: string]: Command};
    channel?: Command;
    role?: Command;
    emote?: Command;
    message?: Command;
    user?: Command;
    id?: "channel" | "role" | "emote" | "message" | "user";
    number?: Command;
    any?: Command;
}

interface CommandOptionsBoth extends CommandOptionsBase {
    channelType: CHANNEL_TYPE.BOTH;
    run?: (($: CommandMenuBoth) => Promise<any>) | string;
}

interface CommandOptionsGuild extends CommandOptionsBase {
    channelType: CHANNEL_TYPE.GUILD;
    run?: (($: CommandMenuGuild) => Promise<any>) | string;
}

interface CommandOptionsDM extends CommandOptionsBase {
    channelType: CHANNEL_TYPE.DM;
    run?: (($: CommandMenuDM) => Promise<any>) | string;
}

type CommandOptions = CommandOptionsBoth | CommandOptionsGuild | CommandOptionsDM;

export enum TYPES {
    SUBCOMMAND, // Any specifically-defined keywords / string literals.
    CHANNEL, // <#...>
    ROLE, // <@&...>
    EMOTE, // <::ID> (The previous two values, animated and emote name respectively, do not matter at all for finding the emote.)
    MESSAGE, // Available by using the built-in "Copy Message Link" or "Copy ID" buttons. https://discordapp.com/channels/<Guild ID>/<Channel ID>/<Message ID> or <Channel ID>-<Message ID> (automatically searches all guilds for the channel ID).
    USER, // <@...> and <@!...>
    ID, // Any number with 17-19 digits. Only used as a redirect to another subcommand type.
    NUMBER, // Any valid number via the Number() function, except for NaN and Infinity (because those can really mess with the program).
    ANY, // Generic argument case.
    NONE // No subcommands exist.
}

export default class Command {
    public readonly description: string;
    public readonly endpoint: boolean;
    public readonly usage: string;
    public readonly permission: number; // -1 (default) indicates to inherit, 0 is the lowest rank, 1 is second lowest rank, and so on.
    public readonly aliases: string[]; // This is to keep the array intact for parent Command instances to use. It'll also be used when loading top-level aliases.
    public originalCommandName: string | null; // If the command is an alias, what's the original name?
    // I'm going to trust that the code knows which one to execute.
    private runAnywhere?: ($: CommandMenuBoth) => Promise<any>;
    private runGuild?: ($: CommandMenuGuild) => Promise<any>;
    private runDM?: ($: CommandMenuDM) => Promise<any>;
    private runMessage?: string;
    private runType: keyof typeof CHANNEL_TYPE | "TEXT";
    public readonly subcommands: Collection<string, Command>; // This is the final data structure you'll actually use to work with the commands the aliases point to.
    public channel: Command | null;
    public role: Command | null;
    public emote: Command | null;
    public message: Command | null;
    public user: Command | null;
    public id: Command | null;
    public number: Command | null;
    public any: Command | null;

    constructor(options: CommandOptions) {
        this.description = options.description || "No description.";
        this.endpoint = options.endpoint || false;
        this.usage = options.usage || "";
        this.permission = options.permission ?? -1;
        this.aliases = options.aliases ?? [];
        this.originalCommandName = null;
        this.subcommands = new Collection(); // Populate this collection after setting subcommands.
        this.channel = options.channel || null;
        this.role = options.role || null;
        this.emote = options.emote || null;
        this.message = options.message || null;
        this.user = options.user || null;
        this.number = options.number || null;
        this.any = options.any || null;

        if (typeof options.run === "string") {
            this.runMessage = options.run;
            this.runType = "TEXT";
        } else if (options.run === undefined) {
            this.runMessage = "No action was set on this command!";
            this.runType = "TEXT";
        } else {
            switch (options.channelType) {
                case CHANNEL_TYPE.BOTH:
                    this.runAnywhere = options.run;
                    this.runType = "BOTH";
                    break;
                case CHANNEL_TYPE.GUILD:
                    this.runGuild = options.run;
                    this.runType = "GUILD";
                    break;
                case CHANNEL_TYPE.DM:
                    this.runDM = options.run;
                    this.runType = "DM";
            }
        }

        switch (options.id) {
            case "channel":
                this.id = this.channel;
                break;
            case "role":
                this.id = this.role;
                break;
            case "emote":
                this.id = this.emote;
                break;
            case "message":
                this.id = this.message;
                break;
            case "user":
                this.id = this.user;
                break;
            default:
                this.id = null;
                break;
        }

        if (options.subcommands) {
            const baseSubcommands = Object.keys(options.subcommands);

            // Loop once to set the base subcommands.
            for (const name in options.subcommands) this.subcommands.set(name, options.subcommands[name]);

            // Then loop again to make aliases point to the base subcommands and warn if something's not right.
            // This shouldn't be a problem because I'm hoping that JS stores these as references that point to the same object.
            for (const name in options.subcommands) {
                const subcmd = options.subcommands[name];
                subcmd.originalCommandName = name;
                const aliases = subcmd.aliases;

                for (const alias of aliases) {
                    if (baseSubcommands.includes(alias))
                        console.warn(
                            `"${alias}" in subcommand "${name}" was attempted to be declared as an alias but it already exists in the base commands! (Look at the next "Loading Command" line to see which command is affected.)`
                        );
                    else if (this.subcommands.has(alias))
                        console.warn(
                            `Duplicate alias "${alias}" at subcommand "${name}"! (Look at the next "Loading Command" line to see which command is affected.)`
                        );
                    else this.subcommands.set(alias, subcmd);
                }
            }
        }

        // Because command aliases don't actually do anything except for subcommands, let the user know that this won't do anything.
        warnCommandAliases(this.channel, "channel");
        warnCommandAliases(this.role, "role");
        warnCommandAliases(this.emote, "emote");
        warnCommandAliases(this.message, "message");
        warnCommandAliases(this.user, "user");
        warnCommandAliases(this.number, "number");
        warnCommandAliases(this.any, "any");

        // Warn on unused endpoints too.
        if (
            this.endpoint &&
            (this.subcommands.size > 0 ||
                this.channel ||
                this.role ||
                this.emote ||
                this.message ||
                this.user ||
                this.number ||
                this.any)
        )
            console.warn(`An endpoint cannot have subcommands!`);
    }

    public execute($: CommandMenu) {
        switch (this.runType) {
            case "BOTH":
                this.runAnywhere!($).catch(handler.bind($));
                break;
            case "GUILD":
                if ($.guild !== null && $.channel.type !== "dm")
                    this.runGuild!($ as CommandMenuGuild).catch(handler.bind($));
                else $.channel.send("You must use this command in a guild!");
                break;
            case "DM":
                if ($.guild === null && $.channel.type === "dm") this.runDM!($ as CommandMenuDM).catch(handler.bind($));
                else $.channel.send("You can't use this command in a guild!");
                break;
            case "TEXT":
                $.channel.send(
                    parseVars(
                        this.runMessage!,
                        {
                            author: $.author.toString(),
                            prefix: getPrefix($.guild)
                        },
                        "???"
                    )
                );
                break;
        }
    }

    public resolve(param: string): TYPES {
        if (this.id && /^\d{17,19}$/.test(param)) {
        }

        if (this.subcommands.has(param)) return TYPES.SUBCOMMAND;
        else if (this.channel && /^<#\d{17,19}>$/.test(param)) return TYPES.CHANNEL;
        else if (this.role && /^<@&\d{17,19}>$/.test(param)) return TYPES.ROLE;
        else if (this.emote && /^<a?:.*?:\d{17,19}>$/.test(param)) return TYPES.EMOTE;
        else if (this.message && /(\d{17,19}\/\d{17,19}\/\d{17,19}$)|(^\d{17,19}-\d{17,19}$)/.test(param))
            return TYPES.MESSAGE;
        else if (this.user && /^<@!?\d{17,19}>$/.test(param)) return TYPES.USER;
        // Disallow infinity and allow for 0.
        else if (this.number && !Number.isNaN(Number(param)) && param !== "Infinity" && param !== "-Infinity")
            return TYPES.NUMBER;
        else if (this.any) return TYPES.ANY;
        else return TYPES.NONE;
    }

    // You can also optionally send in a pre-calculated value if you already called Command.resolve so you don't call it again.
    public get(param: string, type?: TYPES): Command {
        // This expression only runs once, don't worry.
        switch (type ?? this.resolve(param)) {
            case TYPES.SUBCOMMAND:
                return checkResolvedCommand(this.subcommands.get(param));
            case TYPES.CHANNEL:
                return checkResolvedCommand(this.channel);
            case TYPES.ROLE:
                return checkResolvedCommand(this.role);
            case TYPES.EMOTE:
                return checkResolvedCommand(this.emote);
            case TYPES.MESSAGE:
                return checkResolvedCommand(this.message);
            case TYPES.USER:
                return checkResolvedCommand(this.user);
            case TYPES.NUMBER:
                return checkResolvedCommand(this.number);
            case TYPES.ANY:
                return checkResolvedCommand(this.any);
            default:
                return this;
        }
    }
}

function warnCommandAliases(command: Command | null, type: string) {
    if (command && command.aliases.length > 0)
        console.warn(
            `There are aliases defined for an "${type}"-type subcommand, but those aliases won't be used. (Look at the next "Loading Command" line to see which command is affected.)`
        );
}

function checkResolvedCommand(command: Command | null | undefined): Command {
    if (!command) throw new Error("FATAL: Command type mismatch while calling Command.get!");
    return command;
}

// Internally, it'll keep its original capitalization. It's up to you to convert it to title case when you make a help command.
export const categories = new Collection<string, string[]>();

/** Returns the cache of the commands if it exists and searches the directory if not. */
export const loadableCommands = (async () => {
    const commands = new Collection<string, Command>();
    // Include all .ts files recursively in "src/commands/".
    const files = await globP("src/commands/**/*.ts");
    // Extract the usable parts from "src/commands/" if:
    // - The path is 1 to 2 subdirectories (a or a/b, not a/b/c)
    // - Any leading directory isn't "modules"
    // - The filename doesn't end in .test.ts (for jest testing)
    // - The filename cannot be the hardcoded top-level "template.ts", reserved for generating templates
    const pattern = /src\/commands\/(?!template\.ts)(?!modules\/)(\w+(?:\/\w+)?)(?:test\.)?\.ts/;
    const lists: {[category: string]: string[]} = {};

    for (const path of files) {
        const match = pattern.exec(path);

        if (match) {
            const commandID = match[1]; // e.g. "utilities/info"
            const slashIndex = commandID.indexOf("/");
            const isMiscCommand = slashIndex !== -1;
            const category = isMiscCommand ? commandID.substring(0, slashIndex) : "miscellaneous";
            const commandName = isMiscCommand ? commandID.substring(slashIndex + 1) : commandID; // e.g. "info"
            // If the dynamic import works, it must be an object at the very least. Then, just test to see if it's a proper instance.
            const command = (await import(`../commands/${commandID}`)).default as unknown;

            if (command instanceof Command) {
                command.originalCommandName = commandName;

                if (commands.has(commandName)) {
                    console.warn(
                        `Command "${commandName}" already exists! Make sure to make each command uniquely identifiable across categories!`
                    );
                } else {
                    commands.set(commandName, command);
                }

                for (const alias of command.aliases) {
                    if (commands.has(alias)) {
                        console.warn(
                            `Top-level alias "${alias}" from command "${commandID}" already exists either as a command or alias!`
                        );
                    } else {
                        commands.set(alias, command);
                    }
                }

                if (!(category in lists)) lists[category] = [];
                lists[category].push(commandName);

                console.log(`Loading Command: ${commandID}`);
            } else {
                console.warn(`Command "${commandID}" has no default export which is a Command instance!`);
            }
        }
    }

    for (const category in lists) {
        categories.set(category, lists[category]);
    }

    return commands;
})();

function globP(path: string) {
    return new Promise<string[]>((resolve, reject) => {
        glob(path, (error, files) => {
            if (error) {
                reject(error);
            } else {
                resolve(files);
            }
        });
    });
}

// If you use promises, use this function to display the error in chat.
// Case #1: await $.channel.send(""); --> Automatically caught by Command.execute().
// Case #2: $.channel.send("").catch(handler.bind($)); --> Manually caught by the user.
// TODO: Find a way to catch unhandled rejections automatically, forgoing the need for this.
export function handler(this: CommandMenu, error: Error) {
    if (this)
        this.channel.send(
            `There was an error while trying to execute that command!\`\`\`${error.stack ?? error}\`\`\``
        );
    else
        console.warn(
            "No context was attached to $.handler! Make sure to use .catch($.handler.bind($)) or .catch(error => $.handler(error)) instead!"
        );

    console.error(error);
}
