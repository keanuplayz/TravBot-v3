import Event from "../core/event";
import {MessageReaction, User, PartialUser, Permissions} from "discord.js";
import {client} from "../index";

// A list of message ID and callback pairs. You get the emote name and ID of the user reacting.
export const eventListeners: Map<string, (emote: string, id: string) => void> = new Map();

// Attached to the client, there can be one event listener attached to a message ID which is executed if present.
export default new Event({
	on(reaction: MessageReaction, user: User|PartialUser)
	{
		const canDeleteEmotes = !!(client.user && reaction.message.guild?.members.resolve(client.user)?.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES));
		
		if(!canDeleteEmotes)
		{
			const callback = eventListeners.get(reaction.message.id);
			callback && callback(reaction.emoji.name, user.id);
		}
	}
});