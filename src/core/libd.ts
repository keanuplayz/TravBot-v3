// Library for Discord-specific functions
import {
    Message,
    Guild,
    GuildMember,
    Permissions,
    TextChannel,
    DMChannel,
    NewsChannel,
    MessageOptions,
    Channel,
    GuildChannel,
    User,
    APIMessageContentResolvable,
    MessageAdditions,
    SplitOptions,
    APIMessage,
    StringResolvable,
    EmojiIdentifierResolvable,
    MessageReaction
} from "discord.js";
import {unreactEventListeners, replyEventListeners} from "./eventListeners";
import {client} from "./interface";

export type SingleMessageOptions = MessageOptions & {split?: false};

export type SendFunction = ((
    content: APIMessageContentResolvable | (MessageOptions & {split?: false}) | MessageAdditions
) => Promise<Message>) &
    ((options: MessageOptions & {split: true | SplitOptions}) => Promise<Message[]>) &
    ((options: MessageOptions | APIMessage) => Promise<Message | Message[]>) &
    ((content: StringResolvable, options: (MessageOptions & {split?: false}) | MessageAdditions) => Promise<Message>) &
    ((content: StringResolvable, options: MessageOptions & {split: true | SplitOptions}) => Promise<Message[]>) &
    ((content: StringResolvable, options: MessageOptions) => Promise<Message | Message[]>);

const FIVE_BACKWARDS_EMOJI = "⏪";
const BACKWARDS_EMOJI = "⬅️";
const FORWARDS_EMOJI = "➡️";
const FIVE_FORWARDS_EMOJI = "⏩";

// Pagination function that allows for customization via a callback.
// Define your own pages outside the function because this only manages the actual turning of pages.
/**
 * Takes a message and some additional parameters and makes a reaction page with it. All the pagination logic is taken care of but nothing more, the page index is returned and you have to send a callback to do something with it.
 */
export async function paginate(
    send: SendFunction,
    onTurnPage: (page: number, hasMultiplePages: boolean) => SingleMessageOptions,
    totalPages: number,
    listenTo: string | null = null,
    duration = 60000
): Promise<void> {
    const hasMultiplePages = totalPages > 1;
    const message = await send(onTurnPage(0, hasMultiplePages));

    if (hasMultiplePages) {
        let page = 0;
        const turn = (amount: number) => {
            page += amount;

            if (page >= totalPages) {
                page %= totalPages;
            } else if (page < 0) {
                // Assuming 3 total pages, it's a bit tricker, but if we just take the modulo of the absolute value (|page| % total), we get (1 2 0 ...), and we just need the pattern (2 1 0 ...). It needs to reverse order except for when it's 0. I want to find a better solution, but for the time being... total - (|page| % total) unless (|page| % total) = 0, then return 0.
                const flattened = Math.abs(page) % totalPages;
                if (flattened !== 0) page = totalPages - flattened;
            }

            message.edit(onTurnPage(page, true));
        };
        const handle = (emote: string, reacterID: string) => {
            if (reacterID === listenTo || listenTo === null) {
                collector.resetTimer(); // The timer refresh MUST be present in both react and unreact.
                switch (emote) {
                    case FIVE_BACKWARDS_EMOJI:
                        if (totalPages > 5) turn(-5);
                        break;
                    case BACKWARDS_EMOJI:
                        turn(-1);
                        break;
                    case FORWARDS_EMOJI:
                        turn(1);
                        break;
                    case FIVE_FORWARDS_EMOJI:
                        if (totalPages > 5) turn(5);
                        break;
                }
            }
        };

        // Listen for reactions and call the handler.
        let backwardsReactionFive = totalPages > 5 ? await message.react(FIVE_BACKWARDS_EMOJI) : null;
        let backwardsReaction = await message.react(BACKWARDS_EMOJI);
        let forwardsReaction = await message.react(FORWARDS_EMOJI);
        let forwardsReactionFive = totalPages > 5 ? await message.react(FIVE_FORWARDS_EMOJI) : null;
        unreactEventListeners.set(message.id, handle);

        const collector = message.createReactionCollector(
            (reaction, user) => {
                // This check is actually redundant because of handle().
                if (user.id === listenTo || listenTo === null) {
                    // The reason this is inside the call is because it's possible to switch a user's permissions halfway and suddenly throw an error.
                    // This will dynamically adjust for that, switching modes depending on whether it currently has the "Manage Messages" permission.
                    const canDeleteEmotes = botHasPermission(message.guild, Permissions.FLAGS.MANAGE_MESSAGES);
                    handle(reaction.emoji.name, user.id);
                    if (canDeleteEmotes) reaction.users.remove(user);
                }

                return false;
            },
            // Apparently, regardless of whether you put "time" or "idle", it won't matter to the collector.
            // In order to actually reset the timer, you have to do it manually via collector.resetTimer().
            {time: duration}
        );

        // When time's up, remove the bot's own reactions.
        collector.on("end", () => {
            unreactEventListeners.delete(message.id);
            backwardsReactionFive?.users.remove(message.author);
            backwardsReaction.users.remove(message.author);
            forwardsReaction.users.remove(message.author);
            forwardsReactionFive?.users.remove(message.author);
        });
    }
}

//export function generateMulti
// paginate after generateonetimeprompt

// Returns null if timed out, otherwise, returns the value.
export function generateOneTimePrompt<T>(
    message: Message,
    stack: {[emote: string]: T},
    listenTo: string | null = null,
    duration = 60000
): Promise<T | null> {
    return new Promise(async (resolve) => {
        // First, start reacting to the message in order.
        reactInOrder(message, Object.keys(stack));

        // Then setup the reaction listener in parallel.
        await message.awaitReactions(
            (reaction: MessageReaction, user: User) => {
                if (user.id === listenTo || listenTo === null) {
                    const emote = reaction.emoji.name;

                    if (emote in stack) {
                        resolve(stack[emote]);
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

        if (!message.deleted) {
            message.delete();
            resolve(null);
        }
    });
}

// Start a parallel chain of ordered reactions, allowing a collector to end early.
// Check if the collector ended early by seeing if the message is already deleted.
// Though apparently, message.deleted doesn't seem to update fast enough, so just put a try catch block on message.react().
async function reactInOrder(message: Message, emotes: EmojiIdentifierResolvable[]): Promise<void> {
    for (const emote of emotes) {
        try {
            await message.react(emote);
        } catch {
            return;
        }
    }
}

export function confirm(message: Message, senderID: string, timeout = 30000): Promise<boolean | null> {
    return generateOneTimePrompt(
        message,
        {
            "✅": true,
            "❌": false
        },
        senderID,
        timeout
    );
}

// This MUST be split into an array. These emojis are made up of several characters each, adding up to 29 in length.
const multiNumbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

// This will bring up an option to let the user choose between one option out of many.
// This definitely needs a single callback alternative, because using the numerical version isn't actually that uncommon of a pattern.
export async function askMultipleChoice(
    message: Message,
    senderID: string,
    choices: number,
    timeout = 90000
): Promise<number | null> {
    if (choices > multiNumbers.length)
        throw new Error(
            `askMultipleChoice only accepts up to ${multiNumbers.length} options, ${choices} was provided.`
        );
    const numbers: {[emote: string]: number} = {};
    for (let i = 0; i < choices; i++) numbers[multiNumbers[i]] = i;
    return generateOneTimePrompt(message, numbers, senderID, timeout);
}

// Asks the user for some input using the inline reply feature. The message here is a message you send beforehand.
// If the reply is rejected, reply with an error message (when stable support comes from discord.js).
export function askForReply(message: Message, listenTo: string, timeout?: number): Promise<Message | null> {
    return new Promise((resolve) => {
        const referenceID = `${message.channel.id}-${message.id}`;

        replyEventListeners.set(referenceID, (reply) => {
            if (reply.author.id === listenTo) {
                message.delete();
                replyEventListeners.delete(referenceID);
                resolve(reply);
            }
        });

        if (timeout) {
            client.setTimeout(() => {
                if (!message.deleted) message.delete();
                replyEventListeners.delete(referenceID);
                resolve(null);
            }, timeout);
        }
    });
}

/**
 * Tests if a bot has a certain permission in a specified guild.
 */
export function botHasPermission(guild: Guild | null, permission: number): boolean {
    return !!guild?.me?.hasPermission(permission);
}

// For "get x by y" methods:
// Caching: All guilds, channels, and roles are fully cached, while the caches for messages, users, and members aren't complete.
// It's more reliable to get users/members by fetching their IDs. fetch() will searching through the cache anyway.
// For guilds, do an extra check to make sure there isn't an outage (guild.available).

export function getGuildByID(id: string): Guild | string {
    const guild = client.guilds.cache.get(id);

    if (guild) {
        if (guild.available) return guild;
        else return `The guild \`${guild.name}\` (ID: \`${id}\`) is unavailable due to an outage.`;
    } else {
        return `No guild found by the ID of \`${id}\`!`;
    }
}

export function getGuildByName(name: string): Guild | string {
    const query = name.toLowerCase();
    const guild = client.guilds.cache.find((guild) => guild.name.toLowerCase().includes(query));

    if (guild) {
        if (guild.available) return guild;
        else return `The guild \`${guild.name}\` (ID: \`${guild.id}\`) is unavailable due to an outage.`;
    } else {
        return `No guild found by the name of \`${name}\`!`;
    }
}

export async function getChannelByID(id: string): Promise<Channel | string> {
    try {
        return await client.channels.fetch(id);
    } catch {
        return `No channel found by the ID of \`${id}\`!`;
    }
}

// Only go through the cached channels (non-DM channels). Plus, searching DM channels by name wouldn't really make sense, nor do they have names to search anyway.
export function getChannelByName(name: string): GuildChannel | string {
    const query = name.toLowerCase();
    const channel = client.channels.cache.find(
        (channel) => channel instanceof GuildChannel && channel.name.toLowerCase().includes(query)
    ) as GuildChannel | undefined;
    if (channel) return channel;
    else return `No channel found by the name of \`${name}\`!`;
}

export async function getMessageByID(
    channel: TextChannel | DMChannel | NewsChannel | string,
    id: string
): Promise<Message | string> {
    if (typeof channel === "string") {
        const targetChannel = await getChannelByID(channel);
        if (targetChannel instanceof TextChannel || targetChannel instanceof DMChannel) channel = targetChannel;
        else if (targetChannel instanceof Channel) return `\`${id}\` isn't a valid text-based channel!`;
        else return targetChannel;
    }

    try {
        return await channel.messages.fetch(id);
    } catch {
        return `\`${id}\` isn't a valid message of the channel ${channel}!`;
    }
}

export async function getUserByID(id: string): Promise<User | string> {
    try {
        return await client.users.fetch(id);
    } catch {
        return `No user found by the ID of \`${id}\`!`;
    }
}

// Also check tags (if provided) to narrow down users.
export function getUserByName(name: string): User | string {
    let query = name.toLowerCase();
    const tagMatch = /^(.+?)#(\d{4})$/.exec(name);
    let tag: string | null = null;

    if (tagMatch) {
        query = tagMatch[1].toLowerCase();
        tag = tagMatch[2];
    }

    const user = client.users.cache.find((user) => {
        const hasUsernameMatch = user.username.toLowerCase().includes(query);
        if (tag) return hasUsernameMatch && user.discriminator === tag;
        else return hasUsernameMatch;
    });

    if (user) return user;
    else return `No user found by the name of \`${name}\`!`;
}

export async function getMemberByID(guild: Guild, id: string): Promise<GuildMember | string> {
    try {
        return await guild.members.fetch(id);
    } catch {
        return `No member found by the ID of \`${id}\`!`;
    }
}

// First checks if a member can be found by that nickname, then check if a member can be found by that username.
export async function getMemberByName(guild: Guild, name: string): Promise<GuildMember | string> {
    const member = (
        await guild.members.fetch({
            query: name,
            limit: 1
        })
    ).first();

    // Search by username if no member is found, then resolve the user into a member if possible.
    if (member) {
        return member;
    } else {
        const user = getUserByName(name);

        if (user instanceof User) {
            const member = guild.members.resolve(user);
            if (member) return member;
            else return `The user \`${user.tag}\` isn't in this guild!`;
        } else {
            return `No member found by the name of \`${name}\`!`;
        }
    }
}
