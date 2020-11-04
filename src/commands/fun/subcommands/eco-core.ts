import Command from '../../../core/command';
import $ from '../../../core/lib';
import { Storage } from '../../../core/structures';
import { isAuthorized, getMoneyEmbed, getSendEmbed } from './eco-utils';

export const DailyCommand = new Command({
  description:
    'Pick up your daily Mons. The cooldown is per user and every 22 hours to allow for some leeway.',
  async run({ author, channel, guild }) {
    if (isAuthorized(guild, channel)) {
      const user = Storage.getUser(author.id);
      const now = Date.now();

      if (now - user.lastReceived >= 79200000) {
        user.money++;
        user.lastReceived = now;
        Storage.save();
        channel.send({
          embed: {
            title: 'Daily Reward',
            description: 'You received 1 Mon!',
            color: 0xf1c40f,
          },
        });
      } else
        channel.send({
          embed: {
            title: 'Daily Reward',
            description: `It's too soon to pick up your daily credits. You have about ${(
              (user.lastReceived + 79200000 - now) /
              3600000
            ).toFixed(1)} hours to go.`,
            color: 0xf1c40f,
          },
        });
    }
  },
});

export const GuildCommand = new Command({
  description: 'See the richest players.',
  async run({ guild, channel, client }) {
    if (isAuthorized(guild, channel)) {
      const users = Storage.users;
      const ids = Object.keys(users);
      ids.sort((a, b) => users[b].money - users[a].money);
      const fields = [];

      for (let i = 0, limit = Math.min(10, ids.length); i < limit; i++) {
        const id = ids[i];
        const user = await client.users.fetch(id);

        fields.push({
          name: `#${i + 1}. ${user.username}#${user.discriminator}`,
          value: $(users[id].money).pluralise('credit', 's'),
        });
      }

      channel.send({
        embed: {
          title: 'Top 10 Richest Players',
          color: '#ffff00',
          fields: fields,
        },
      });
    }
  },
});

export const PayCommand = new Command({
  description: 'Send money to someone.',
  usage: '<user> <amount>',
  run: 'Who are you sending this money to?',
  user: new Command({
    run: "You need to enter an amount you're sending!",
    number: new Command({
      async run({ args, author, channel, guild }): Promise<any> {
        if (isAuthorized(guild, channel)) {
          const amount = Math.floor(args[1]);
          const sender = Storage.getUser(author.id);
          const target = args[0];
          const receiver = Storage.getUser(target.id);

          if (amount <= 0)
            return channel.send('You must send at least one Mon!');
          else if (sender.money < amount)
            return channel.send(
              "You don't have enough Mons for that.",
              getMoneyEmbed(author),
            );
          else if (target.id === author.id)
            return channel.send("You can't send Mons to yourself!");
          else if (target.bot && process.argv[2] !== 'dev')
            return channel.send("You can't send Mons to a bot!");

          sender.money -= amount;
          receiver.money += amount;
          Storage.save();
          return channel.send(getSendEmbed(author, target, amount));
        }
      },
    }),
  }),
  number: new Command({
    run: 'You must use the format `money send <user> <amount>`!',
  }),
  any: new Command({
    async run({ args, author, channel, guild, prompt }) {
      if (isAuthorized(guild, channel)) {
        const last = args.pop();

        if (!/\d+/g.test(last) && args.length === 0)
          return channel.send("You need to enter an amount you're sending!");

        const amount = Math.floor(last);
        const sender = Storage.getUser(author.id);

        if (amount <= 0)
          return channel.send('You must send at least one credit!');
        else if (sender.money < amount)
          return channel.send(
            "You don't have enough money to do that!",
            getMoneyEmbed(author),
          );
        else if (!guild)
          return channel.send(
            'You have to use this in a server if you want to send money with a username!',
          );

        const username = args.join(' ');
        const member = (
          await guild.members.fetch({
            query: username,
            limit: 1,
          })
        ).first();

        if (!member)
          return channel.send(
            `Couldn't find a user by the name of \`${username}\`! If you want to send money to someone in a different server, you have to use their user ID!`,
          );
        else if (member.user.id === author.id)
          return channel.send("You can't send money to yourself!");
        else if (member.user.bot && process.argv[2] !== 'dev')
          return channel.send("You can't send money to a bot!");

        const target = member.user;

        return prompt(
          await channel.send(
            `Are you sure you want to send ${$(amount).pluralise(
              'credit',
              's',
            )} to this person?\n*(This message will automatically be deleted after 10 seconds.)*`,
            {
              embed: {
                color: '#ffff00',
                author: {
                  name: `${target.username}#${target.discriminator}`,
                  icon_url: target.displayAvatarURL({
                    format: 'png',
                    dynamic: true,
                  }),
                },
              },
            },
          ),
          author.id,
          () => {
            const receiver = Storage.getUser(target.id);
            sender.money -= amount;
            receiver.money += amount;
            Storage.save();
            channel.send(getSendEmbed(author, target, amount));
          },
        );
      }
    },
  }),
});
