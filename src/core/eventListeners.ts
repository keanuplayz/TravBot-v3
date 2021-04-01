import {client} from "../index";
import {botHasPermission} from "./libd";
import {Permissions, Message} from "discord.js";

// A list of message ID and callback pairs. You get the emote name and ID of the user reacting.
export const unreactEventListeners: Map<string, (emote: string, id: string) => void> = new Map();

// Attached to the client, there can be one event listener attached to a message ID which is executed if present.
client.on("messageReactionRemove", (reaction, user) => {
    const canDeleteEmotes = botHasPermission(reaction.message.guild, Permissions.FLAGS.MANAGE_MESSAGES);

    if (!canDeleteEmotes) {
        const callback = unreactEventListeners.get(reaction.message.id);
        callback && callback(reaction.emoji.name, user.id);
    }
});

// A list of "channel-message" and callback pairs. Also, I imagine that the callback will be much more maintainable when discord.js v13 comes out with a dedicated message.referencedMessage property.
// Also, I'm defining it here instead of the message event because the load order screws up if you export it from there. Yeah... I'm starting to notice just how much technical debt has been built up. The command handler needs to be modularized and refactored sooner rather than later. Define all constants in one area then grab from there.
export const replyEventListeners = new Map<string, (message: Message) => void>();

client.on("message", (message) => {
    // If there's an inline reply, fire off that event listener (if it exists).
    if (message.reference) {
        const reference = message.reference;
        replyEventListeners.get(`${reference.channelID}-${reference.messageID}`)?.(message);
    }
});
