import { MessageEmbed } from 'discord.js';
import Command from '../../core/command';
import { CommonLibrary } from '../../core/lib';

export default new Command({
  description: "Lists all emotes the bot has in it's registry,",
  endpoint: true,
  async run($: CommonLibrary): Promise<any> {
    const nsfw: string | string[] = [];
    const pages = $.client.emojis.cache
      .filter((x) => !nsfw.includes(x.guild.id), this)
      .array();
    const pagesSplit = $(pages).split(20);
    $.log(pagesSplit);
    var embed = new MessageEmbed().setTitle('**Emoji list!**').setColor('AQUA');
    let desc = '';
    for (const emote of pagesSplit[0]) {
      desc += `${emote} | ${emote.name}\n`;
    }
    embed.setDescription(desc);
    const msg = await $.channel.send({ embed });

    $.paginate(msg, $.author.id, pages.length, (page) => {
      let desc = '';
      for (const emote of pagesSplit[page]) {
        desc += `${emote} | ${emote.name}\n`;
      }
      embed.setDescription(desc);
      msg.edit(embed);
    });
  },
});
