import Command from '../../core/command';
import { CommonLibrary } from '../../core/lib';

export default new Command({
  description:
    'Reacts to the a previous message in your place. You have to react with the same emote before the bot removes that reaction.',
  usage: 'react <emote name> (<message ID / distance>)',
  async run($: CommonLibrary): Promise<any> {
    let target;
    let distance = 1;

    if ($.args.length >= 2) {
      const last = $.args[$.args.length - 1];

      if (/\d{17,19}/g.test(last)) {
        try {
          target = await $.channel.messages.fetch(last);
        } catch {
          return $.channel.send(
            `No valid message found by the ID \`${last}\`!`,
          );
        }
        $.args.pop();
      }
      // The entire string has to be a number for this to match. Prevents leaCheeseAmerican1 from triggering this.
      else if (/^\d+$/g.test(last)) {
        distance = parseInt(last);

        if (distance >= 0 && distance <= 99) $.args.pop();
        else return $.channel.send('Your distance must be between 0 and 99!');
      }
    }

    if (!target) {
      // Messages are ordered from latest to earliest.
      // You also have to add 1 as well because fetchMessages includes your own message.
      target = (
        await $.message.channel.messages.fetch({
          limit: distance + 1,
        })
      ).last();
    }

    let anyEmoteIsValid = false;

    for (const search of $.args) {
      const emoji = $.client.emojis.cache.find(
        (emoji) => emoji.name === search,
      );

      if (emoji) {
        // Call the delete function only once to avoid unnecessary errors.
        if (!anyEmoteIsValid && distance !== 0) $.message.delete();
        anyEmoteIsValid = true;
        const reaction = await target?.react(emoji);

        // This part is called with a promise because you don't want to wait 5 seconds between each reaction.

        setTimeout(() => {
          /// @ts-ignore
          reaction.users.remove($.client.user);
        }, 5000);
      }
    }

    if (!anyEmoteIsValid && !$.message.deleted) $.message.react('❓');
  },
});
