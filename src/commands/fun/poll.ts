import { MessageEmbed } from 'discord.js';
import Command from '../../core/command';
import { CommonLibrary } from '../../core/lib';

export default new Command({
  description: 'Create a poll.',
  usage: '<question>',
  run: 'Please provide a question.',
  any: new Command({
    description: 'Question for the poll.',
    async run($: CommonLibrary): Promise<any> {
      const embed = new MessageEmbed()
        .setAuthor(
          `Poll created by ${$.message.author.username}`,
          $.message.guild?.iconURL({ dynamic: true }) ?? undefined,
        )
        .setColor(0xffffff)
        .setFooter('React to vote.')
        .setDescription($.args.join(' '));
      const msg = await $.channel.send(embed);
      await msg.react('✅');
      await msg.react('⛔');
      $.message.delete({
        timeout: 1000,
      });
    },
  }),
});
