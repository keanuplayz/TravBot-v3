import {
    Collection,
    Client,
    Message,
    TextChannel,
    DMChannel,
    NewsChannel,
    Guild,
    User,
    GuildMember,
    GuildChannel
} from "discord.js";
import {SingleMessageOptions} from "./libd";
import {hasPermission, getPermissionLevel, getPermissionName} from "./permissions";
import {getPrefix} from "./interface";
import {parseVars} from "../lib";

/**
 * ===[ Command Types ]===
 * SUBCOMMAND - Any specifically-defined keywords / string literals.
 * CHANNEL - <#...>
 * ROLE - <@&...>
 * EMOTE - <::ID> (The previous two values, animated and emote name respectively, do not matter at all for finding the emote.)
 * MESSAGE - Available by using the built-in "Copy Message Link" or "Copy ID" buttons. https://discordapp.com/channels/<Guild ID>/<Channel ID>/<Message ID> or <Channel ID>-<Message ID> (automatically searches all guilds for the channel ID).
 * USER - <@...> and <@!...>
 * ID - Any number with 17-19 digits. Only used as a redirect to another subcommand type.
 * NUMBER - Any valid number via the Number() function, except for NaN and Infinity (because those can really mess with the program).
 * ANY - Generic argument case.
 * NONE - No subcommands exist.
 */

// RegEx patterns used for identifying/extracting each type from a string argument.
const patterns = {
    channel: /^<#(\d{17,19})>$/,
    role: /^<@&(\d{17,19})>$/,
    emote: /^<a?:.*?:(\d{17,19})>$/,
    message: /(?:\d{17,19}\/(\d{17,19})\/(\d{17,19})$)|(?:^(\d{17,19})-(\d{17,19})$)/,
    user: /^<@!?(\d{17,19})>$/,
    id: /^(\d{17,19})$/
};

// Callbacks don't work with discriminated unions:
// - https://github.com/microsoft/TypeScript/issues/41759
// - https://github.com/microsoft/TypeScript/issues/35769
// Therefore, there won't by any type narrowing on channel or guild of CommandMenu until this is fixed.
// Otherwise, you'd have to define channelType for every single subcommand, which would get very tedious.
// Just use type assertions when you specify a channel type.
export enum CHANNEL_TYPE {
    ANY,
    GUILD,
    DM
}

interface CommandMenu {
    readonly args: any[];
    readonly client: Client;
    readonly message: Message;
    readonly channel: TextChannel | DMChannel | NewsChannel;
    readonly guild: Guild | null;
    readonly author: User;
    // According to the documentation, a message can be part of a guild while also not having a
    // member object for the author. This will happen if the author of a message left the guild.
    readonly member: GuildMember | null;
}

interface CommandOptionsBase {
    readonly description?: string;
    readonly endpoint?: boolean;
    readonly usage?: string;
    readonly permission?: number;
    readonly nsfw?: boolean;
    readonly channelType?: CHANNEL_TYPE;
    readonly run?: (($: CommandMenu) => Promise<any>) | string;
}

interface CommandOptionsEndpoint {
    readonly endpoint: true;
}

// Prevents subcommands from being added by compile-time.
interface CommandOptionsNonEndpoint {
    readonly endpoint?: false;
    readonly subcommands?: {[key: string]: NamedCommand};
    readonly user?: Command;
    readonly number?: Command;
    readonly any?: Command;
}

type CommandOptions = CommandOptionsBase & (CommandOptionsEndpoint | CommandOptionsNonEndpoint);
type NamedCommandOptions = CommandOptions & {aliases?: string[]};

interface ExecuteCommandMetadata {
    readonly header: string;
    readonly args: string[];
    permission: number;
    nsfw: boolean;
    channelType: CHANNEL_TYPE;
}

interface CommandInfo {
    readonly type: "info";
    readonly command: Command;
    readonly subcommandInfo: Collection<string, Command>;
    readonly keyedSubcommandInfo: Collection<string, NamedCommand>;
    readonly permission: number;
    readonly nsfw: boolean;
    readonly channelType: CHANNEL_TYPE;
    readonly args: string[];
}

interface CommandInfoError {
    readonly type: "error";
    readonly message: string;
}

interface CommandInfoMetadata {
    permission: number;
    nsfw: boolean;
    channelType: CHANNEL_TYPE;
    args: string[];
    usage: string;
}

export const defaultMetadata = {
    permission: 0,
    nsfw: false,
    channelType: CHANNEL_TYPE.ANY
};

export class Command {
    public readonly description: string;
    public readonly endpoint: boolean;
    public readonly usage: string;
    public readonly permission: number; // -1 (default) indicates to inherit, 0 is the lowest rank, 1 is second lowest rank, and so on.
    public readonly nsfw: boolean | null; // null (default) indicates to inherit
    public readonly channelType: CHANNEL_TYPE | null; // null (default) indicates to inherit
    protected run: (($: CommandMenu) => Promise<any>) | string;
    protected readonly subcommands: Collection<string, NamedCommand>; // This is the final data structure you'll actually use to work with the commands the aliases point to.
    protected user: Command | null;
    protected number: Command | null;
    protected any: Command | null;

    constructor(options?: CommandOptions) {
        this.description = options?.description || "No description.";
        this.endpoint = !!options?.endpoint;
        this.usage = options?.usage ?? "";
        this.permission = options?.permission ?? -1;
        this.nsfw = options?.nsfw ?? null;
        this.channelType = options?.channelType ?? null;
        this.run = options?.run || "No action was set on this command!";
        this.subcommands = new Collection(); // Populate this collection after setting subcommands.
        this.user = null;
        this.number = null;
        this.any = null;

        if (options && !options.endpoint) {
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
                    subcmd.name = name;
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
        }
    }

    // Go through the arguments provided and find the right subcommand, then execute with the given arguments.
    // Will return null if it successfully executes, SingleMessageOptions if there's an error (to let the user know what it is).
    public async execute(
        args: string[],
        menu: CommandMenu,
        metadata: ExecuteCommandMetadata
    ): Promise<SingleMessageOptions | null> {
        // Update inherited properties if the current command specifies a property.
        // In case there are no initial arguments, these should go first so that it can register.
        if (this.permission !== -1) metadata.permission = this.permission;
        if (this.nsfw !== null) metadata.nsfw = this.nsfw;
        if (this.channelType !== null) metadata.channelType = this.channelType;

        // Take off the leftmost argument from the list.
        const param = args.shift();

        // If there are no arguments left, execute the current command. Otherwise, continue on.
        if (param === undefined) {
            // See if there is anything that'll prevent the user from executing the command.

            // 1. Does this command specify a required channel type? If so, does the channel type match?
            if (
                metadata.channelType === CHANNEL_TYPE.GUILD &&
                (!(menu.channel instanceof GuildChannel) || menu.guild === null)
            ) {
                return {content: "This command must be executed in a server."};
            } else if (
                metadata.channelType === CHANNEL_TYPE.DM &&
                (menu.channel.type !== "dm" || menu.guild !== null)
            ) {
                return {content: "This command must be executed as a direct message."};
            }

            // 2. Is this an NSFW command where the channel prevents such use? (DM channels bypass this requirement.)
            if (metadata.nsfw && menu.channel.type !== "dm" && !menu.channel.nsfw) {
                return {content: "This command must be executed in either an NSFW channel or as a direct message."};
            }

            // 3. Does the user have permission to execute the command?
            if (!hasPermission(menu.author, menu.member, metadata.permission)) {
                const userPermLevel = getPermissionLevel(menu.author, menu.member);

                return {
                    content: `You don't have access to this command! Your permission level is \`${getPermissionName(
                        userPermLevel
                    )}\` (${userPermLevel}), but this command requires a permission level of \`${getPermissionName(
                        metadata.permission
                    )}\` (${metadata.permission}).`
                };
            }

            // Then capture any potential errors.
            try {
                if (typeof this.run === "string") {
                    await menu.channel.send(
                        parseVars(
                            this.run,
                            {
                                author: menu.author.toString(),
                                prefix: getPrefix(menu.guild)
                            },
                            "???"
                        )
                    );
                } else {
                    await this.run(menu);
                }

                return null;
            } catch (error) {
                const errorMessage = error.stack ?? error;
                console.error(`Command Error: ${metadata.header} (${metadata.args.join(", ")})\n${errorMessage}`);

                return {
                    content: `There was an error while trying to execute that command!\`\`\`${errorMessage}\`\`\``
                };
            }
        }

        // If the current command is an endpoint but there are still some arguments left, don't continue.
        if (this.endpoint) return {content: "Too many arguments!"};

        // Resolve the value of the current command's argument (adding it to the resolved args),
        // then pass the thread of execution to whichever subcommand is valid (if any).
        if (this.subcommands.has(param)) {
            return this.subcommands.get(param)!.execute(args, menu, metadata);
        } else if (this.user && patterns.user.test(param)) {
            const id = patterns.user.exec(param)![1];

            try {
                menu.args.push(await menu.client.users.fetch(id));
                return this.user.execute(args, menu, metadata);
            } catch {
                return {
                    content: `No user found by the ID \`${id}\`!`
                };
            }
        } else if (this.number && !Number.isNaN(Number(param)) && param !== "Infinity" && param !== "-Infinity") {
            menu.args.push(Number(param));
            return this.number.execute(args, menu, metadata);
        } else if (this.any) {
            menu.args.push(param);
            return this.any.execute(args, menu, metadata);
        } else {
            // Continue adding on the rest of the arguments if there's no valid subcommand.
            menu.args.push(param);
            return this.execute(args, menu, metadata);
        }

        // Note: Do NOT add a return statement here. In case one of the other sections is missing
        // a return statement, there'll be a compile error to catch that.
    }

    // What this does is resolve the resulting subcommand as well as the inherited properties and the available subcommands.
    public async resolveInfo(args: string[]): Promise<CommandInfo | CommandInfoError> {
        return this.resolveInfoInternal(args, {...defaultMetadata, args: [], usage: ""});
    }

    private async resolveInfoInternal(
        args: string[],
        metadata: CommandInfoMetadata
    ): Promise<CommandInfo | CommandInfoError> {
        // Update inherited properties if the current command specifies a property.
        // In case there are no initial arguments, these should go first so that it can register.
        if (this.permission !== -1) metadata.permission = this.permission;
        if (this.nsfw !== null) metadata.nsfw = this.nsfw;
        if (this.channelType !== null) metadata.channelType = this.channelType;
        if (this.usage !== "") metadata.usage = this.usage;

        // Take off the leftmost argument from the list.
        const param = args.shift();

        // If there are no arguments left, return the data or an error message.
        if (param === undefined) {
            const keyedSubcommandInfo = new Collection<string, NamedCommand>();
            const subcommandInfo = new Collection<string, Command>();

            // Get all the subcommands of the current command but without aliases.
            for (const [tag, command] of this.subcommands.entries()) {
                // Don't capture duplicates generated from aliases.
                if (tag === command.name) {
                    keyedSubcommandInfo.set(tag, command);
                }
            }

            // Then get all the generic subcommands.
            if (this.user) subcommandInfo.set("<user>", this.user);
            if (this.number) subcommandInfo.set("<number>", this.number);
            if (this.any) subcommandInfo.set("<any>", this.any);

            return {
                type: "info",
                command: this,
                keyedSubcommandInfo,
                subcommandInfo,
                ...metadata
            };
        }

        // Then test if anything fits any hardcoded values, otherwise check if it's a valid keyed subcommand.
        if (param === "<user>") {
            if (this.user) {
                metadata.args.push("<user>");
                return this.user.resolveInfoInternal(args, metadata);
            } else {
                return {
                    type: "error",
                    message: `No subcommand found by the argument list: \`${metadata.args.join(" ")}\``
                };
            }
        } else if (param === "<number>") {
            if (this.number) {
                metadata.args.push("<number>");
                return this.number.resolveInfoInternal(args, metadata);
            } else {
                return {
                    type: "error",
                    message: `No subcommand found by the argument list: \`${metadata.args.join(" ")}\``
                };
            }
        } else if (param === "<any>") {
            if (this.any) {
                metadata.args.push("<any>");
                return this.any.resolveInfoInternal(args, metadata);
            } else {
                return {
                    type: "error",
                    message: `No subcommand found by the argument list: \`${metadata.args.join(" ")}\``
                };
            }
        } else if (this.subcommands?.has(param)) {
            metadata.args.push(param);
            return this.subcommands.get(param)!.resolveInfoInternal(args, metadata);
        } else {
            return {
                type: "error",
                message: `No subcommand found by the argument list: \`${metadata.args.join(" ")}\``
            };
        }
    }
}

export class NamedCommand extends Command {
    public readonly aliases: string[]; // This is to keep the array intact for parent Command instances to use. It'll also be used when loading top-level aliases.
    private originalCommandName: string | null; // If the command is an alias, what's the original name?

    constructor(options?: NamedCommandOptions) {
        super(options);
        this.aliases = options?.aliases || [];
        this.originalCommandName = null;
    }

    public get name(): string {
        if (this.originalCommandName === null) throw new Error("originalCommandName must be set before accessing it!");
        else return this.originalCommandName;
    }

    public set name(value: string) {
        if (this.originalCommandName !== null)
            throw new Error(`originalCommandName cannot be set twice! Attempted to set the value to "${value}".`);
        else this.originalCommandName = value;
    }
}
