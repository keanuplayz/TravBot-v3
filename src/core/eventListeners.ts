import {Client, Permissions, Message, MessageReaction, User, PartialUser} from "discord.js";
import {botHasPermission} from "./libd";

// A list of message ID and callback pairs. You get the emote name and ID of the user reacting.
// This will handle removing reactions automatically (if the bot has the right permission).
export const reactEventListeners = new Map<string, (reaction: MessageReaction, user: User | PartialUser) => void>();
export const emptyReactEventListeners = new Map<string, () => void>();

// A list of "channel-message" and callback pairs. Also, I imagine that the callback will be much more maintainable when discord.js v13 comes out with a dedicated message.referencedMessage property.
export const replyEventListeners = new Map<string, (message: Message) => void>();

export function attachEventListenersToClient(client: Client) {
    client.on("messageReactionAdd", (reaction, user) => {
        // The reason this is inside the call is because it's possible to switch a user's permissions halfway and suddenly throw an error.
        // This will dynamically adjust for that, switching modes depending on whether it currently has the "Manage Messages" permission.
        const canDeleteEmotes = botHasPermission(reaction.message.guild, Permissions.FLAGS.MANAGE_MESSAGES);
        reactEventListeners.get(reaction.message.id)?.(reaction, user);
        if (canDeleteEmotes && !user.partial) reaction.users.remove(user);
    });

    client.on("messageReactionRemove", (reaction, user) => {
        const canDeleteEmotes = botHasPermission(reaction.message.guild, Permissions.FLAGS.MANAGE_MESSAGES);
        if (!canDeleteEmotes) reactEventListeners.get(reaction.message.id)?.(reaction, user);
    });

    client.on("messageReactionRemoveAll", (message) => {
        reactEventListeners.delete(message.id);
        emptyReactEventListeners.get(message.id)?.();
        emptyReactEventListeners.delete(message.id);
    });

    client.on("message", (message) => {
        // If there's an inline reply, fire off that event listener (if it exists).
        if (message.reference) {
            const reference = message.reference;
            replyEventListeners.get(`${reference.channelID}-${reference.messageID}`)?.(message);
        }
    });
}
