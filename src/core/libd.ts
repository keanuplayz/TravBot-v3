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
    User
} from "discord.js";
import {unreactEventListeners, replyEventListeners} from "./eventListeners";
import {client} from "./interface";

export type SingleMessageOptions = MessageOptions & {split?: false};

/**
 * Tests if a bot has a certain permission in a specified guild.
 */
export function botHasPermission(guild: Guild | null, permission: number): boolean {
    return !!guild?.me?.hasPermission(permission);
}

// The SoonTM Section //
// Maybe promisify this section to reduce the potential for creating callback hell? Especially if multiple questions in a row are being asked.
// It's probably a good idea to modularize the base reaction handler so there's less copy pasted code.
// Maybe also make a reaction handler that listens for when reactions are added and removed.
// The reaction handler would also run an async function to react in order (parallel to the reaction handler).

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
    channel: TextChannel | DMChannel | NewsChannel,
    senderID: string,
    total: number,
    callback: (page: number, hasMultiplePages: boolean) => SingleMessageOptions,
    duration = 60000
) {
    const hasMultiplePages = total > 1;
    const message = await channel.send(callback(0, hasMultiplePages));

    if (hasMultiplePages) {
        let page = 0;
        const turn = (amount: number) => {
            page += amount;

            if (page >= total) {
                page %= total;
            } else if (page < 0) {
                // Assuming 3 total pages, it's a bit tricker, but if we just take the modulo of the absolute value (|page| % total), we get (1 2 0 ...), and we just need the pattern (2 1 0 ...). It needs to reverse order except for when it's 0. I want to find a better solution, but for the time being... total - (|page| % total) unless (|page| % total) = 0, then return 0.
                const flattened = Math.abs(page) % total;
                if (flattened !== 0) page = total - flattened;
            }

            message.edit(callback(page, true));
        };
        const handle = (emote: string, reacterID: string) => {
            if (senderID === reacterID) {
                switch (emote) {
                    case FIVE_BACKWARDS_EMOJI:
                        if (total > 5) turn(-5);
                        break;
                    case BACKWARDS_EMOJI:
                        turn(-1);
                        break;
                    case FORWARDS_EMOJI:
                        turn(1);
                        break;
                    case FIVE_FORWARDS_EMOJI:
                        if (total > 5) turn(5);
                        break;
                }
            }
        };

        // Listen for reactions and call the handler.
        let backwardsReactionFive = total > 5 ? await message.react(FIVE_BACKWARDS_EMOJI) : null;
        let backwardsReaction = await message.react(BACKWARDS_EMOJI);
        let forwardsReaction = await message.react(FORWARDS_EMOJI);
        let forwardsReactionFive = total > 5 ? await message.react(FIVE_FORWARDS_EMOJI) : null;
        unreactEventListeners.set(message.id, handle);

        const collector = message.createReactionCollector(
            (reaction, user) => {
                if (user.id === senderID) {
                    // The reason this is inside the call is because it's possible to switch a user's permissions halfway and suddenly throw an error.
                    // This will dynamically adjust for that, switching modes depending on whether it currently has the "Manage Messages" permission.
                    const canDeleteEmotes = botHasPermission(message.guild, Permissions.FLAGS.MANAGE_MESSAGES);
                    handle(reaction.emoji.name, user.id);
                    if (canDeleteEmotes) reaction.users.remove(user);
                    collector.resetTimer();
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

// Waits for the sender to either confirm an action or let it pass (and delete the message).
// This should probably be renamed to "confirm" now that I think of it, "prompt" is better used elsewhere.
// Append "\n*(This message will automatically be deleted after 10 seconds.)*" in the future?
/**
 * Prompts the user about a decision before following through.
 */
export async function prompt(message: Message, senderID: string, onConfirm: () => void, duration = 10000) {
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
}

// Asks the user for some input using the inline reply feature. The message here is a message you send beforehand.
// If the reply is rejected, reply with an error message (when stable support comes from discord.js).
// Append "\n*(Note: Make sure to use Discord's inline reply feature or this won't work!)*" in the future? And also the "you can now reply to this message" edit.
export function ask(
    message: Message,
    senderID: string,
    condition: (reply: string) => boolean,
    onSuccess: () => void,
    onReject: () => string,
    timeout = 60000
) {
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
}

export function askYesOrNo(message: Message, senderID: string, timeout = 30000): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        let isDeleted = false;

        await message.react("✅");
        message.react("❌");
        await message.awaitReactions(
            (reaction, user) => {
                if (user.id === senderID) {
                    const isCheckReacted = reaction.emoji.name === "✅";

                    if (isCheckReacted || reaction.emoji.name === "❌") {
                        resolve(isCheckReacted);
                        isDeleted = true;
                        message.delete();
                    }
                }

                return false;
            },
            {time: timeout}
        );

        if (!isDeleted) {
            message.delete();
            reject("Prompt timed out.");
        }
    });
}

// This MUST be split into an array. These emojis are made up of several characters each, adding up to 29 in length.
const multiNumbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

// This will bring up an option to let the user choose between one option out of many.
// This definitely needs a single callback alternative, because using the numerical version isn't actually that uncommon of a pattern.
export async function askMultipleChoice(
    message: Message,
    senderID: string,
    callbackStack: (() => void)[],
    timeout = 90000
) {
    if (callbackStack.length > multiNumbers.length) {
        message.channel.send(
            `\`ERROR: The amount of callbacks in "askMultipleChoice" must not exceed the total amount of allowed options (${multiNumbers.length})!\``
        );
        return;
    }

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
}

// For "get x by y" methods:
// Caching: All guilds, channels, and roles are fully cached, while the caches for messages, users, and members aren't complete.
// It's more reliable to get users/members by fetching their IDs. fetch() will searching through the cache anyway.
// For guilds, do an extra check to make sure there isn't an outage (guild.available).

export function getGuildByID(id: string): Guild | SingleMessageOptions {
    const guild = client.guilds.cache.get(id);

    if (guild) {
        if (guild.available) return guild;
        else return {content: `The guild \`${guild.name}\` (ID: \`${id}\`) is unavailable due to an outage.`};
    } else {
        return {
            content: `No guild found by the ID of \`${id}\`!`
        };
    }
}

export function getGuildByName(name: string): Guild | SingleMessageOptions {
    const query = name.toLowerCase();
    const guild = client.guilds.cache.find((guild) => guild.name.toLowerCase().includes(query));

    if (guild) {
        if (guild.available) return guild;
        else return {content: `The guild \`${guild.name}\` (ID: \`${guild.id}\`) is unavailable due to an outage.`};
    } else {
        return {
            content: `No guild found by the name of \`${name}\`!`
        };
    }
}

export async function getChannelByID(id: string): Promise<Channel | SingleMessageOptions> {
    try {
        return await client.channels.fetch(id);
    } catch {
        return {content: `No channel found by the ID of \`${id}\`!`};
    }
}

// Only go through the cached channels (non-DM channels). Plus, searching DM channels by name wouldn't really make sense, nor do they have names to search anyway.
export function getChannelByName(name: string): GuildChannel | SingleMessageOptions {
    const query = name.toLowerCase();
    const channel = client.channels.cache.find(
        (channel) => channel instanceof GuildChannel && channel.name.toLowerCase().includes(query)
    ) as GuildChannel | undefined;
    if (channel) return channel;
    else return {content: `No channel found by the name of \`${name}\`!`};
}

export async function getMessageByID(
    channel: TextChannel | DMChannel | NewsChannel | string,
    id: string
): Promise<Message | SingleMessageOptions> {
    if (typeof channel === "string") {
        const targetChannel = await getChannelByID(channel);
        if (targetChannel instanceof TextChannel || targetChannel instanceof DMChannel) channel = targetChannel;
        else if (targetChannel instanceof Channel) return {content: `\`${id}\` isn't a valid text-based channel!`};
        else return targetChannel;
    }

    try {
        return await channel.messages.fetch(id);
    } catch {
        return {content: `\`${id}\` isn't a valid message of the channel ${channel}!`};
    }
}

export async function getUserByID(id: string): Promise<User | SingleMessageOptions> {
    try {
        return await client.users.fetch(id);
    } catch {
        return {content: `No user found by the ID of \`${id}\`!`};
    }
}

// Also check tags (if provided) to narrow down users.
export function getUserByName(name: string): User | SingleMessageOptions {
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
    else return {content: `No user found by the name of \`${name}\`!`};
}

export async function getMemberByID(guild: Guild, id: string): Promise<GuildMember | SingleMessageOptions> {
    try {
        return await guild.members.fetch(id);
    } catch {
        return {content: `No member found by the ID of \`${id}\`!`};
    }
}

// First checks if a member can be found by that nickname, then check if a member can be found by that username.
export async function getMemberByName(guild: Guild, name: string): Promise<GuildMember | SingleMessageOptions> {
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
            else return {content: `The user \`${user.tag}\` isn't in this guild!`};
        } else {
            return {content: `No member found by the name of \`${name}\`!`};
        }
    }
}
