import Event from '../core/event';
import { client } from '../index';
import $ from '../core/lib';
import * as discord from 'discord.js';

export default new Event<'channelDelete'>({
  async on(channel) {
    const botGuilds = client.guilds;
    if (channel instanceof discord.GuildChannel) {
      const createdGuild = await botGuilds.fetch(channel.guild.id);
      $.log(
        `Channel deleted in '${createdGuild.name}' called '#${channel.name}'`,
      );
    }
  },
});
