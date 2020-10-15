import Event from '../core/event';
import { Permissions } from 'discord.js';
import { botHasPermission } from '../core/lib';

// A list of message ID and callback pairs. You get the emote name and ID of the user reacting.
export const eventListeners: Map<
  string,
  (emote: string, id: string) => void
> = new Map();

// Attached to the client, there can be one event listener attached to a message ID which is executed if present.
export default new Event<'messageReactionRemove'>({
  on(reaction, user) {
    const canDeleteEmotes = botHasPermission(
      reaction.message.guild,
      Permissions.FLAGS.MANAGE_MESSAGES,
    );

    if (!canDeleteEmotes) {
      const callback = eventListeners.get(reaction.message.id);
      callback && callback(reaction.emoji.name, user.id);
    }
  },
});
