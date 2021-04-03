import {parseVars} from "./lib";
import {Collection} from "discord.js";
import {Client, Message, TextChannel, DMChannel, NewsChannel, Guild, User, GuildMember} from "discord.js";
import {getPrefix} from "../core/structures";
import {SingleMessageOptions} from "./libd";
import {hasPermission, getPermissionLevel, getPermissionName} from "./permissions";

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

enum TYPES {
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

    // Will return null if it successfully executes, SingleMessageOptions if there's an error (to let the user know what it is).
    public async actualExecute(args: string[], tmp: any): Promise<SingleMessageOptions | null> {
        // Subcommand Recursion //
        let command = commands.get(header)!;
        //resolveSubcommand()
        const params: any[] = [];
        let isEndpoint = false;
        let permLevel = command.permission ?? 0;

        for (const param of args) {
            if (command.endpoint) {
                if (command.subcommands.size > 0 || command.user || command.number || command.any)
                    console.warn("An endpoint cannot have subcommands!");
                isEndpoint = true;
                break;
            }

            const type = command.resolve(param);
            command = command.get(param);
            permLevel = command.permission ?? permLevel;

            if (type === TYPES.USER) {
                const id = param.match(/\d+/g)![0];
                try {
                    params.push(await message.client.users.fetch(id));
                } catch (error) {
                    return message.channel.send(`No user found by the ID \`${id}\`!`);
                }
            } else if (type === TYPES.NUMBER) params.push(Number(param));
            else if (type !== TYPES.SUBCOMMAND) params.push(param);
        }

        if (!message.member)
            return console.warn("This command was likely called from a DM channel meaning the member object is null.");

        if (!hasPermission(message.member, permLevel)) {
            const userPermLevel = getPermissionLevel(message.member);
            return message.channel.send(
                `You don't have access to this command! Your permission level is \`${getPermissionName(
                    userPermLevel
                )}\` (${userPermLevel}), but this command requires a permission level of \`${getPermissionName(
                    permLevel
                )}\` (${permLevel}).`
            );
        }

        if (isEndpoint) return message.channel.send("Too many arguments!");

        command.execute({
            args: params,
            author: message.author,
            channel: message.channel,
            client: message.client,
            guild: message.guild,
            member: message.member,
            message: message
        });

        return null;
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

    // Returns: [category, command name, command, available subcommands: [type, subcommand]]
    public resolveCommandInfo(args: string[]): [string, string, Command, Collection<string, Command>] {
        const commands = await loadableCommands;
        let header = args.shift();
        let command = commands.get(header);

        if (!command || header === "test") {
            $.channel.send(`No command found by the name \`${header}\`!`);
            return;
        }

        if (command.originalCommandName) header = command.originalCommandName;
        else console.warn(`originalCommandName isn't defined for ${header}?!`);

        let permLevel = command.permission ?? 0;
        let usage = command.usage;
        let invalid = false;

        let selectedCategory = "Unknown";

        for (const [category, headers] of categories) {
            if (headers.includes(header)) {
                if (selectedCategory !== "Unknown")
                    console.warn(
                        `Command "${header}" is somehow in multiple categories. This means that the command loading stage probably failed in properly adding categories.`
                    );
                else selectedCategory = toTitleCase(category);
            }
        }

        for (const param of args) {
            const type = command.resolve(param);
            command = command.get(param);
            permLevel = command.permission ?? permLevel;

            if (permLevel === -1) permLevel = command.permission;

            switch (type) {
                case TYPES.SUBCOMMAND:
                    header += ` ${command.originalCommandName}`;
                    break;
                case TYPES.USER:
                    header += " <user>";
                    break;
                case TYPES.NUMBER:
                    header += " <number>";
                    break;
                case TYPES.ANY:
                    header += " <any>";
                    break;
                default:
                    header += ` ${param}`;
                    break;
            }

            if (type === TYPES.NONE) {
                invalid = true;
                break;
            }
        }

        if (invalid) {
            $.channel.send(`No command found by the name \`${header}\`!`);
            return;
        }
    }
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
