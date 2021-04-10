// Library for Discord-specific functions
import {
    Message,
    Guild,
    GuildMember,
    Permissions,
    TextChannel,
    DMChannel,
    NewsChannel,
    MessageOptions
} from "discord.js";
import {unreactEventListeners, replyEventListeners} from "./eventListeners";

export type SingleMessageOptions = MessageOptions & {split?: false};

/**
 * Tests if a bot has a certain permission in a specified guild.
 */
export function botHasPermission(guild: Guild | null, permission: number): boolean {
    return !!guild?.me?.hasPermission(permission);
}

// Maybe promisify this section to reduce the potential for creating callback hell? Especially if multiple questions in a row are being asked.

// Pagination function that allows for customization via a callback.
// Define your own pages outside the function because this only manages the actual turning of pages.

const FIVE_BACKWARDS_EMOJI = "⏪";
const BACKWARDS_EMOJI = "⬅️";
const FORWARDS_EMOJI = "➡️";
const FIVE_FORWARDS_EMOJI = "⏩";

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

/**
 * Gets a user by their username. Gets the first one then rolls with it.
 */
export async function getMemberByUsername(guild: Guild, username: string) {
    return (
        await guild.members.fetch({
            query: username,
            limit: 1
        })
    ).first();
}

/**
 * Convenience function to handle cases where someone isn't found by a username automatically.
 */
export async function callMemberByUsername(
    message: Message,
    username: string,
    onSuccess: (member: GuildMember) => void
) {
    const guild = message.guild;
    const send = message.channel.send;

    if (guild) {
        const member = await getMemberByUsername(guild, username);

        if (member) onSuccess(member);
        else send(`Couldn't find a user by the name of \`${username}\`!`);
    } else send("You must execute this command in a server!");
}

// TO DO Section //

// getGuildByID() - checks for guild.available (boolean)
// getGuildByName()
// findMemberByNickname() - gets a member by their nickname or their username
// findUserByUsername()

// For "get x by y" methods:
// Caching: All guilds, channels, and roles are fully cached, while the caches for messages, users, and members aren't complete.
// It's more reliable to get users/members by fetching their IDs. fetch() will searching through the cache anyway.
