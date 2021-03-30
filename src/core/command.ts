import {parseVars} from "./libd";
import {Collection} from "discord.js";
import {Client, Message, TextChannel, DMChannel, NewsChannel, Guild, User, GuildMember} from "discord.js";
import {getPrefix} from "../core/structures";
import glob from "glob";

interface CommandMenu {
    args: any[];
    client: Client;
    message: Message;
    channel: TextChannel | DMChannel | NewsChannel;
    guild: Guild | null;
    author: User;
    member: GuildMember | null;
}

interface CommandOptions {
    description?: string;
    endpoint?: boolean;
    usage?: string;
    permission?: number;
    aliases?: string[];
    run?: (($: CommandMenu) => Promise<any>) | string;
    subcommands?: {[key: string]: Command};
    user?: Command;
    number?: Command;
    any?: Command;
}

export enum TYPES {
    SUBCOMMAND,
    USER,
    NUMBER,
    ANY,
    NONE
}

export default class Command {
    public readonly description: string;
    public readonly endpoint: boolean;
    public readonly usage: string;
    public readonly permission: number; // -1 (default) indicates to inherit, 0 is the lowest rank, 1 is second lowest rank, and so on.
    public readonly aliases: string[]; // This is to keep the array intact for parent Command instances to use. It'll also be used when loading top-level aliases.
    public originalCommandName: string | null; // If the command is an alias, what's the original name?
    public run: (($: CommandMenu) => Promise<any>) | string;
    public readonly subcommands: Collection<string, Command>; // This is the final data structure you'll actually use to work with the commands the aliases point to.
    public user: Command | null;
    public number: Command | null;
    public any: Command | null;
    public static readonly TYPES = TYPES;

    constructor(options?: CommandOptions) {
        this.description = options?.description || "No description.";
        this.endpoint = options?.endpoint || false;
        this.usage = options?.usage || "";
        this.permission = options?.permission ?? -1;
        this.aliases = options?.aliases ?? [];
        this.originalCommandName = null;
        this.run = options?.run || "No action was set on this command!";
        this.subcommands = new Collection(); // Populate this collection after setting subcommands.
        this.user = options?.user || null;
        this.number = options?.number || null;
        this.any = options?.any || null;

        if (options?.subcommands) {
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

        if (this.user && this.user.aliases.length > 0)
            console.warn(
                `There are aliases defined for a "user"-type subcommand, but those aliases won't be used. (Look at the next "Loading Command" line to see which command is affected.)`
            );

        if (this.number && this.number.aliases.length > 0)
            console.warn(
                `There are aliases defined for a "number"-type subcommand, but those aliases won't be used. (Look at the next "Loading Command" line to see which command is affected.)`
            );

        if (this.any && this.any.aliases.length > 0)
            console.warn(
                `There are aliases defined for an "any"-type subcommand, but those aliases won't be used. (Look at the next "Loading Command" line to see which command is affected.)`
            );
    }

    public execute($: CommandMenu) {
        if (typeof this.run === "string") {
            $.channel.send(
                parseVars(
                    this.run,
                    {
                        author: $.author.toString(),
                        prefix: getPrefix($.guild)
                    },
                    "???"
                )
            );
        } else this.run($).catch(handler.bind($));
    }

    public resolve(param: string): TYPES {
        if (this.subcommands.has(param)) return TYPES.SUBCOMMAND;
        // Any Discord ID format will automatically format to a user ID.
        else if (this.user && /\d{17,19}/.test(param)) return TYPES.USER;
        // Disallow infinity and allow for 0.
        else if (this.number && (Number(param) || param === "0") && !param.includes("Infinity")) return TYPES.NUMBER;
        else if (this.any) return TYPES.ANY;
        else return TYPES.NONE;
    }

    public get(param: string): Command {
        const type = this.resolve(param);
        let command: Command;

        switch (type) {
            case TYPES.SUBCOMMAND:
                command = this.subcommands.get(param) as Command;
                break;
            case TYPES.USER:
                command = this.user as Command;
                break;
            case TYPES.NUMBER:
                command = this.number as Command;
                break;
            case TYPES.ANY:
                command = this.any as Command;
                break;
            default:
                command = this;
                break;
        }

        return command;
    }
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
