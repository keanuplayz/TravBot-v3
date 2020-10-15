import { MessageEmbed } from 'discord.js';
import Command from '../core/command';
import { CommonLibrary } from '../core/lib';

export default new Command({
  description: 'Various utilities.',
  endpoint: false,
  usage: '',
  async run($: CommonLibrary): Promise<any> {},
  subcommands: {
    lsemotes: new Command({
      description: "Lists all emotes the bot has in it's registry,",
      endpoint: true,
      async run($: CommonLibrary): Promise<any> {
        const nsfw: string | string[] = [];
        const pages = $.client.emojis.cache
          .filter((x) => !nsfw.includes(x.guild.id), this)
          .array();
        const pagesSplit = $(pages).split(20);
        $.log(pagesSplit);
        var embed = new MessageEmbed()
          .setTitle('**Emoji list!**')
          .setColor('AQUA');
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
    }),
    emote: new Command({
      description: 'Send the specified emote.',
      run: 'Please provide a command name.',
      any: new Command({
        description: 'The emote to send.',
        usage: '<emote>',
        async run($: CommonLibrary): Promise<any> {
          const search = $.args[0].toLowerCase();
          const emote = $.client.emojis.cache.find((emote) =>
            emote.name.toLowerCase().includes(search),
          );
          if (!emote) return $.channel.send("That's not a valid emote name!");
          $.message.delete();
          $.channel.send(`${emote}`);
        },
      }),
    }),
  },
});
