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
    GuildChannel,
    Channel
} from "discord.js";
import {getChannelByID, getGuildByID, getMessageByID, getUserByID, SendFunction} from "./libd";
import {hasPermission, getPermissionLevel, getPermissionName} from "./permissions";
import {getPrefix} from "./interface";
import {parseVars, requireAllCasesHandledFor} from "../lib";

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
// The reason why \d{17,} is used is because the max safe number for JS numbers is 16 characters when stringified (decimal). Beyond that are IDs.
const patterns = {
    channel: /^<#(\d{17,})>$/,
    role: /^<@&(\d{17,})>$/,
    emote: /^<a?:.*?:(\d{17,})>$/,
    // The message type won't include <username>#<tag>. At that point, you may as well just use a search usernames function. Even then, tags would only be taken into account to differentiate different users with identical usernames.
    messageLink: /^https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/(?:\d{17,}|@me)\/(\d{17,})\/(\d{17,})$/,
    messagePair: /^(\d{17,})-(\d{17,})$/,
    user: /^<@!?(\d{17,})>$/,
    id: /^(\d{17,})$/
};

// Maybe add a guild redirect... somehow?
type ID = "channel" | "role" | "emote" | "message" | "user" | "guild";

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
    readonly send: SendFunction;
}

interface CommandOptionsBase {
    readonly description?: string;
    readonly usage?: string;
    readonly permission?: number;
    readonly nsfw?: boolean;
    readonly channelType?: CHANNEL_TYPE;
}

// Also, contrary to what you might think, channel pings do still work in DM channels.
// Role pings, maybe not, but it's not a big deal.
interface CommandOptions extends CommandOptionsBase {
    readonly run?: (($: CommandMenu) => Promise<any>) | string;
    readonly subcommands?: {[key: string]: NamedCommand};
    readonly channel?: Command;
    readonly role?: Command;
    readonly emote?: Command;
    readonly message?: Command;
    readonly user?: Command;
    readonly guild?: Command; // Only available if an ID is set to reroute to it.
    readonly id?: ID;
    readonly number?: Command;
    readonly any?: Command | RestCommand;
}

interface NamedCommandOptions extends CommandOptions {
    readonly aliases?: string[];
    readonly nameOverride?: string;
}

interface RestCommandOptions extends CommandOptionsBase {
    readonly run?: (($: CommandMenu & {readonly combined: string}) => Promise<any>) | string;
}

interface ExecuteCommandMetadata {
    readonly header: string;
    readonly args: string[];
    permission: number;
    nsfw: boolean;
    channelType: CHANNEL_TYPE;
    symbolicArgs: string[]; // i.e. <channel> instead of <#...>
}

export interface CommandInfo {
    readonly type: "info";
    readonly command: BaseCommand;
    readonly subcommandInfo: Collection<string, BaseCommand>;
    readonly keyedSubcommandInfo: Collection<string, BaseCommand>;
    readonly permission: number;
    readonly nsfw: boolean;
    readonly channelType: CHANNEL_TYPE;
    readonly args: string[];
    readonly header: string;
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
    readonly originalArgs: string[];
    readonly header: string;
}

// An isolated command of just the metadata.
abstract class BaseCommand {
    public readonly description: string;
    public readonly usage: string;
    public readonly permission: number; // -1 (default) indicates to inherit, 0 is the lowest rank, 1 is second lowest rank, and so on.
    public readonly nsfw: boolean | null; // null (default) indicates to inherit
    public readonly channelType: CHANNEL_TYPE | null; // null (default) indicates to inherit

    constructor(options?: CommandOptionsBase) {
        this.description = options?.description || "No description.";
        this.usage = options?.usage ?? "";
        this.permission = options?.permission ?? -1;
        this.nsfw = options?.nsfw ?? null;
        this.channelType = options?.channelType ?? null;
    }
}

// Each Command instance represents a block that links other Command instances under it.
export class Command extends BaseCommand {
    // The execute and subcommand properties are restricted to the class because subcommand recursion could easily break when manually handled.
    // The class will handle checking for null fields.
    private run: (($: CommandMenu) => Promise<any>) | string;
    private readonly subcommands: Collection<string, NamedCommand>; // This is the final data structure you'll actually use to work with the commands the aliases point to.
    private channel: Command | null;
    private role: Command | null;
    private emote: Command | null;
    private message: Command | null;
    private user: Command | null;
    private guild: Command | null;
    private id: Command | null;
    private idType: ID | null;
    private number: Command | null;
    private any: Command | RestCommand | null;

    constructor(options?: CommandOptions) {
        super(options);
        this.run = options?.run || "No action was set on this command!";
        this.subcommands = new Collection(); // Populate this collection after setting subcommands.
        this.channel = options?.channel || null;
        this.role = options?.role || null;
        this.emote = options?.emote || null;
        this.message = options?.message || null;
        this.user = options?.user || null;
        this.guild = options?.guild || null;
        this.id = null;
        this.idType = options?.id || null;
        this.number = options?.number || null;
        this.any = options?.any || null;

        if (options)
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
                case "guild":
                    this.id = this.guild;
                    break;
                case undefined:
                    break;
                default:
                    requireAllCasesHandledFor(options.id);
            }

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

    // Go through the arguments provided and find the right subcommand, then execute with the given arguments.
    // Will return null if it successfully executes, string if there's an error (to let the user know what it is).
    //
    // Calls the resulting subcommand's execute method in order to make more modular code, basically pushing the chain of execution to the subcommand.
    // For example, a numeric subcommand would accept args of [4] then execute on it.
    //
    // Because each Command instance is isolated from others, it becomes practically impossible to predict the total amount of subcommands when isolating the code to handle each individual layer of recursion.
    // Therefore, if a Command is declared as a rest type, any typed args that come at the end must be handled manually.
    public async execute(args: string[], menu: CommandMenu, metadata: ExecuteCommandMetadata): Promise<string | null> {
        // Update inherited properties if the current command specifies a property.
        // In case there are no initial arguments, these should go first so that it can register.
        if (this.permission !== -1) metadata.permission = this.permission;
        if (this.nsfw !== null) metadata.nsfw = this.nsfw;
        if (this.channelType !== null) metadata.channelType = this.channelType;

        // Take off the leftmost argument from the list.
        const param = args.shift();

        // If there are no arguments left, execute the current command. Otherwise, continue on.
        if (param === undefined) {
            const error = canExecute(menu, metadata);
            if (error) return error;

            if (typeof this.run === "string") {
                // Although I *could* add an option in the launcher to attach arbitrary variables to this var string...
                // I'll just leave it like this, because instead of using var strings for user stuff, you could just make "run" a template string.
                await menu.send(
                    parseVars(
                        this.run,
                        {
                            author: menu.author.toString(),
                            prefix: getPrefix(menu.guild),
                            command: `${metadata.header} ${metadata.symbolicArgs.join(", ")}`
                        },
                        "???"
                    )
                );
            } else {
                // Then capture any potential errors.
                try {
                    await this.run(menu);
                } catch (error) {
                    const errorMessage = error.stack ?? error;
                    console.error(`Command Error: ${metadata.header} (${metadata.args.join(", ")})\n${errorMessage}`);

                    return `There was an error while trying to execute that command!\`\`\`${errorMessage}\`\`\``;
                }
            }

            return null;
        }

        // Resolve the value of the current command's argument (adding it to the resolved args),
        // then pass the thread of execution to whichever subcommand is valid (if any).
        const isMessageLink = patterns.messageLink.test(param);
        const isMessagePair = patterns.messagePair.test(param);

        if (this.subcommands.has(param)) {
            metadata.symbolicArgs.push(param);
            return this.subcommands.get(param)!.execute(args, menu, metadata);
        } else if (this.channel && patterns.channel.test(param)) {
            const id = patterns.channel.exec(param)![1];
            const channel = await getChannelByID(id);

            if (typeof channel !== "string") {
                if (channel instanceof TextChannel || channel instanceof DMChannel) {
                    metadata.symbolicArgs.push("<channel>");
                    menu.args.push(channel);
                    return this.channel.execute(args, menu, metadata);
                } else {
                    return `\`${id}\` is not a valid text channel!`;
                }
            } else {
                return channel;
            }
        } else if (this.role && patterns.role.test(param)) {
            const id = patterns.role.exec(param)![1];

            if (!menu.guild) {
                return "You can't use role parameters in DM channels!";
            }

            const role = menu.guild.roles.cache.get(id);

            if (role) {
                metadata.symbolicArgs.push("<role>");
                menu.args.push(role);
                return this.role.execute(args, menu, metadata);
            } else {
                return `\`${id}\` is not a valid role in this server!`;
            }
        } else if (this.emote && patterns.emote.test(param)) {
            const id = patterns.emote.exec(param)![1];
            const emote = menu.client.emojis.cache.get(id);

            if (emote) {
                metadata.symbolicArgs.push("<emote>");
                menu.args.push(emote);
                return this.emote.execute(args, menu, metadata);
            } else {
                return `\`${id}\` isn't a valid emote!`;
            }
        } else if (this.message && (isMessageLink || isMessagePair)) {
            let channelID = "";
            let messageID = "";

            if (isMessageLink) {
                const result = patterns.messageLink.exec(param)!;
                channelID = result[1];
                messageID = result[2];
            } else if (isMessagePair) {
                const result = patterns.messagePair.exec(param)!;
                channelID = result[1];
                messageID = result[2];
            }

            const message = await getMessageByID(channelID, messageID);

            if (typeof message !== "string") {
                metadata.symbolicArgs.push("<message>");
                menu.args.push(message);
                return this.message.execute(args, menu, metadata);
            } else {
                return message;
            }
        } else if (this.user && patterns.user.test(param)) {
            const id = patterns.user.exec(param)![1];
            const user = await getUserByID(id);

            if (typeof user !== "string") {
                metadata.symbolicArgs.push("<user>");
                menu.args.push(user);
                return this.user.execute(args, menu, metadata);
            } else {
                return user;
            }
        } else if (this.id && this.idType && patterns.id.test(param)) {
            metadata.symbolicArgs.push("<id>");
            const id = patterns.id.exec(param)![1];

            // Probably modularize the findXByY code in general in libd.
            // Because this part is pretty much a whole bunch of copy pastes.
            switch (this.idType) {
                case "channel":
                    const channel = await getChannelByID(id);

                    if (typeof channel !== "string") {
                        if (channel instanceof TextChannel || channel instanceof DMChannel) {
                            metadata.symbolicArgs.push("<channel>");
                            menu.args.push(channel);
                            return this.id.execute(args, menu, metadata);
                        } else {
                            return `\`${id}\` is not a valid text channel!`;
                        }
                    } else {
                        return channel;
                    }
                case "role":
                    if (!menu.guild) {
                        return "You can't use role parameters in DM channels!";
                    }

                    const role = menu.guild.roles.cache.get(id);

                    if (role) {
                        menu.args.push(role);
                        return this.id.execute(args, menu, metadata);
                    } else {
                        return `\`${id}\` isn't a valid role in this server!`;
                    }
                case "emote":
                    const emote = menu.client.emojis.cache.get(id);

                    if (emote) {
                        menu.args.push(emote);
                        return this.id.execute(args, menu, metadata);
                    } else {
                        return `\`${id}\` isn't a valid emote!`;
                    }
                case "message":
                    const message = await getMessageByID(menu.channel, id);

                    if (typeof message !== "string") {
                        menu.args.push(message);
                        return this.id.execute(args, menu, metadata);
                    } else {
                        return message;
                    }
                case "user":
                    const user = await getUserByID(id);

                    if (typeof user !== "string") {
                        menu.args.push(user);
                        return this.id.execute(args, menu, metadata);
                    } else {
                        return user;
                    }
                case "guild":
                    const guild = getGuildByID(id);

                    if (typeof guild !== "string") {
                        menu.args.push(guild);
                        return this.id.execute(args, menu, metadata);
                    } else {
                        return guild;
                    }
                default:
                    requireAllCasesHandledFor(this.idType);
            }
        } else if (this.number && !Number.isNaN(Number(param)) && param !== "Infinity" && param !== "-Infinity") {
            metadata.symbolicArgs.push("<number>");
            menu.args.push(Number(param));
            return this.number.execute(args, menu, metadata);
        } else if (this.any instanceof Command) {
            metadata.symbolicArgs.push("<any>");
            menu.args.push(param);
            return this.any.execute(args, menu, metadata);
        } else if (this.any instanceof RestCommand) {
            metadata.symbolicArgs.push("<...>");
            args.unshift(param);
            menu.args.push(...args);
            return this.any.execute(args.join(" "), menu, metadata);
        } else {
            metadata.symbolicArgs.push(`"${param}"`);
            return `No valid command sequence matching \`${metadata.header} ${metadata.symbolicArgs.join(
                " "
            )}\` found.`;
        }

        // Note: Do NOT add a return statement here. In case one of the other sections is missing
        // a return statement, there'll be a compile error to catch that.
    }

    // What this does is resolve the resulting subcommand as well as the inherited properties and the available subcommands.
    public resolveInfo(args: string[], header: string): CommandInfo | CommandInfoError {
        return this.resolveInfoInternal(args, {
            permission: 0,
            nsfw: false,
            channelType: CHANNEL_TYPE.ANY,
            header,
            args: [],
            usage: "",
            originalArgs: [...args]
        });
    }

    private resolveInfoInternal(args: string[], metadata: CommandInfoMetadata): CommandInfo | CommandInfoError {
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
            const keyedSubcommandInfo = new Collection<string, BaseCommand>();
            const subcommandInfo = new Collection<string, BaseCommand>();

            // Get all the subcommands of the current command but without aliases.
            for (const [tag, command] of this.subcommands.entries()) {
                // Don't capture duplicates generated from aliases.
                if (tag === command.name) {
                    keyedSubcommandInfo.set(tag, command);
                }
            }

            // Then get all the generic subcommands.
            if (this.channel) subcommandInfo.set("<channel>", this.channel);
            if (this.role) subcommandInfo.set("<role>", this.role);
            if (this.emote) subcommandInfo.set("<emote>", this.emote);
            if (this.message) subcommandInfo.set("<message>", this.message);
            if (this.user) subcommandInfo.set("<user>", this.user);
            if (this.id) subcommandInfo.set(`<id = <${this.idType}>>`, this.id);
            if (this.number) subcommandInfo.set("<number>", this.number);

            // The special case for a possible rest command.
            if (this.any) {
                if (this.any instanceof Command) subcommandInfo.set("<any>", this.any);
                else subcommandInfo.set("<...>", this.any);
            }

            return {
                type: "info",
                command: this,
                keyedSubcommandInfo,
                subcommandInfo,
                ...metadata
            };
        }

        const invalidSubcommandGenerator: () => CommandInfoError = () => ({
            type: "error",
            message: `No subcommand found by the argument list: \`${metadata.originalArgs.join(" ")}\``
        });

        // Then test if anything fits any hardcoded values, otherwise check if it's a valid keyed subcommand.
        if (param === "<channel>") {
            if (this.channel) {
                metadata.args.push("<channel>");
                return this.channel.resolveInfoInternal(args, metadata);
            } else {
                return invalidSubcommandGenerator();
            }
        } else if (param === "<role>") {
            if (this.role) {
                metadata.args.push("<role>");
                return this.role.resolveInfoInternal(args, metadata);
            } else {
                return invalidSubcommandGenerator();
            }
        } else if (param === "<emote>") {
            if (this.emote) {
                metadata.args.push("<emote>");
                return this.emote.resolveInfoInternal(args, metadata);
            } else {
                return invalidSubcommandGenerator();
            }
        } else if (param === "<message>") {
            if (this.message) {
                metadata.args.push("<message>");
                return this.message.resolveInfoInternal(args, metadata);
            } else {
                return invalidSubcommandGenerator();
            }
        } else if (param === "<user>") {
            if (this.user) {
                metadata.args.push("<user>");
                return this.user.resolveInfoInternal(args, metadata);
            } else {
                return invalidSubcommandGenerator();
            }
        } else if (param === "<id>") {
            if (this.id) {
                metadata.args.push(`<id = <${this.idType}>>`);
                return this.id.resolveInfoInternal(args, metadata);
            } else {
                return invalidSubcommandGenerator();
            }
        } else if (param === "<number>") {
            if (this.number) {
                metadata.args.push("<number>");
                return this.number.resolveInfoInternal(args, metadata);
            } else {
                return invalidSubcommandGenerator();
            }
        } else if (param === "<any>") {
            if (this.any instanceof Command) {
                metadata.args.push("<any>");
                return this.any.resolveInfoInternal(args, metadata);
            } else {
                return invalidSubcommandGenerator();
            }
        } else if (param === "<...>") {
            if (this.any instanceof RestCommand) {
                metadata.args.push("<...>");
                return this.any.resolveInfoFinale(metadata);
            } else {
                return invalidSubcommandGenerator();
            }
        } else if (this.subcommands?.has(param)) {
            metadata.args.push(param);
            return this.subcommands.get(param)!.resolveInfoInternal(args, metadata);
        } else {
            return invalidSubcommandGenerator();
        }
    }
}

export class NamedCommand extends Command {
    public readonly aliases: string[]; // This is to keep the array intact for parent Command instances to use. It'll also be used when loading top-level aliases.
    private originalCommandName: string | null; // If the command is an alias, what's the original name?

    constructor(options?: NamedCommandOptions) {
        super(options);
        this.aliases = options?.aliases || [];
        // The name override exists in case a user wants to bypass filename restrictions.
        this.originalCommandName = options?.nameOverride ?? null;
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

    public isNameSet(): boolean {
        return this.originalCommandName !== null;
    }
}

// RestCommand is a declarative version of the common "any: args.join(' ')" pattern, basically the Command version of a rest parameter.
// This way, you avoid having extra subcommands when using this pattern.
// I'm probably not going to add a transformer function (a callback to automatically handle stuff like searching for usernames).
// I don't think the effort to figure this part out via generics or something is worth it.
export class RestCommand extends BaseCommand {
    private run: (($: CommandMenu & {readonly combined: string}) => Promise<any>) | string;

    constructor(options?: RestCommandOptions) {
        super(options);
        this.run = options?.run || "No action was set on this command!";
    }

    public async execute(
        combined: string,
        menu: CommandMenu,
        metadata: ExecuteCommandMetadata
    ): Promise<string | null> {
        // Update inherited properties if the current command specifies a property.
        // In case there are no initial arguments, these should go first so that it can register.
        if (this.permission !== -1) metadata.permission = this.permission;
        if (this.nsfw !== null) metadata.nsfw = this.nsfw;
        if (this.channelType !== null) metadata.channelType = this.channelType;

        const error = canExecute(menu, metadata);
        if (error) return error;

        if (typeof this.run === "string") {
            // Although I *could* add an option in the launcher to attach arbitrary variables to this var string...
            // I'll just leave it like this, because instead of using var strings for user stuff, you could just make "run" a template string.
            await menu.send(
                parseVars(
                    this.run,
                    {
                        author: menu.author.toString(),
                        prefix: getPrefix(menu.guild),
                        command: `${metadata.header} ${metadata.symbolicArgs.join(", ")}`
                    },
                    "???"
                )
            );
        } else {
            // Then capture any potential errors.
            try {
                // Args will still be kept intact. A common pattern is popping some parameters off the end then doing some branching.
                // That way, you can still declaratively mark an argument list as continuing while also handling the individual args.
                await this.run({...menu, args: menu.args, combined});
            } catch (error) {
                const errorMessage = error.stack ?? error;
                console.error(`Command Error: ${metadata.header} (${metadata.args.join(", ")})\n${errorMessage}`);

                return `There was an error while trying to execute that command!\`\`\`${errorMessage}\`\`\``;
            }
        }

        return null;
    }

    public resolveInfoFinale(metadata: CommandInfoMetadata): CommandInfo {
        if (this.permission !== -1) metadata.permission = this.permission;
        if (this.nsfw !== null) metadata.nsfw = this.nsfw;
        if (this.channelType !== null) metadata.channelType = this.channelType;
        if (this.usage !== "") metadata.usage = this.usage;

        return {
            type: "info",
            command: this,
            keyedSubcommandInfo: new Collection<string, BaseCommand>(),
            subcommandInfo: new Collection<string, BaseCommand>(),
            ...metadata
        };
    }
}

// See if there is anything that'll prevent the user from executing the command.
// Returns null if successful, otherwise returns a message with the error.
function canExecute(menu: CommandMenu, metadata: ExecuteCommandMetadata): string | null {
    // 1. Does this command specify a required channel type? If so, does the channel type match?
    if (
        metadata.channelType === CHANNEL_TYPE.GUILD &&
        (!(menu.channel instanceof GuildChannel) || menu.guild === null || menu.member === null)
    ) {
        return "This command must be executed in a server.";
    } else if (
        metadata.channelType === CHANNEL_TYPE.DM &&
        (menu.channel.type !== "dm" || menu.guild !== null || menu.member !== null)
    ) {
        return "This command must be executed as a direct message.";
    }

    // 2. Is this an NSFW command where the channel prevents such use? (DM channels bypass this requirement.)
    if (metadata.nsfw && menu.channel.type !== "dm" && !menu.channel.nsfw) {
        return "This command must be executed in either an NSFW channel or as a direct message.";
    }

    // 3. Does the user have permission to execute the command?
    if (!hasPermission(menu.author, menu.member, metadata.permission)) {
        const userPermLevel = getPermissionLevel(menu.author, menu.member);

        return `You don't have access to this command! Your permission level is \`${getPermissionName(
            userPermLevel
        )}\` (${userPermLevel}), but this command requires a permission level of \`${getPermissionName(
            metadata.permission
        )}\` (${metadata.permission}).`;
    }

    return null;
}
