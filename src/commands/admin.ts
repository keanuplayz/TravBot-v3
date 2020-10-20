import Command from '../core/command';
import { CommonLibrary, logs, botHasPermission } from '../core/lib';
import { Config, Storage } from '../core/structures';
import { PermissionNames, getPermissionLevel } from '../core/permissions';
import { Permissions } from 'discord.js';
import * as discord from 'discord.js';

function getLogBuffer(type: string) {
  return {
    files: [
      {
        attachment: Buffer.alloc(logs[type].length, logs[type]),
        name: `${Date.now()}.${type}.log`,
      },
    ],
  };
}

const activities = ['playing', 'listening', 'streaming', 'watching'];

export default new Command({
  description:
    "An all-in-one command to do admin stuff. You need to be either an admin of the server or one of the bot's mechanics to use this command.",
  async run($: CommonLibrary): Promise<any> {
    if (!$.member)
      return $.channel.send(
        "Couldn't find a member object for you! Did you make sure you used this in a server?",
      );
    const permLevel = getPermissionLevel($.member);
    $.channel.send(
      `${$.author.toString()}, your permission level is \`${
        PermissionNames[permLevel]
      }\` (${permLevel}).`,
    );
  },
  subcommands: {
    set: new Command({
      description: 'Set different per-guild settings for the bot.',
      run: 'You have to specify the option you want to set.',
      permission: Command.PERMISSIONS.ADMIN,
      subcommands: {
        prefix: new Command({
          description:
            'Set a custom prefix for your guild. Removes your custom prefix if none is provided.',
          usage: '(<prefix>)',
          async run($: CommonLibrary): Promise<any> {
            Storage.getGuild($.guild?.id || 'N/A').prefix = null;
            Storage.save();
            $.channel.send(
              `The custom prefix for this guild has been removed. My prefix is now back to \`${Config.prefix}\`.`,
            );
          },
          any: new Command({
            async run($: CommonLibrary): Promise<any> {
              Storage.getGuild($.guild?.id || 'N/A').prefix = $.args[0];
              Storage.save();
              $.channel.send(
                `The custom prefix for this guild is now \`${$.args[0]}\`.`,
              );
            },
          }),
        }),
      },
    }),
    diag: new Command({
      description: 'Requests a debug log with the "info" verbosity level.',
      permission: Command.PERMISSIONS.BOT_SUPPORT,
      async run($: CommonLibrary): Promise<any> {
        $.channel.send(getLogBuffer('info'));
      },
      any: new Command({
        description: `Select a verbosity to listen to. Available levels: \`[${Object.keys(
          logs,
        ).join(', ')}]\``,
        async run($: CommonLibrary): Promise<any> {
          const type = $.args[0];

          if (type in logs) $.channel.send(getLogBuffer(type));
          else
            $.channel.send(
              `Couldn't find a verbosity level named \`${type}\`! The available types are \`[${Object.keys(
                logs,
              ).join(', ')}]\`.`,
            );
        },
      }),
    }),
    status: new Command({
      description: "Changes the bot's status.",
      permission: Command.PERMISSIONS.BOT_SUPPORT,
      async run($: CommonLibrary): Promise<any> {
        $.channel.send('Setting status to `online`...');
      },
      any: new Command({
        description: `Select a status to set to. Available statuses: \`online\`, \`idle\`, \`dnd\`, \`invisible\``,
        async run($: CommonLibrary): Promise<any> {
          let statuses = ['online', 'idle', 'dnd', 'invisible'];
          if (!statuses.includes($.args[0]))
            return $.channel.send("That status doesn't exist!");
          else {
            $.client.user?.setStatus($.args[0]);
            $.channel.send(`Setting status to \`${$.args[0]}\`...`);
          }
        },
      }),
    }),
    purge: new Command({
      description: 'Purges bot messages.',
      permission: Command.PERMISSIONS.BOT_SUPPORT,
      async run($: CommonLibrary): Promise<any> {
        if ($.message.channel instanceof discord.DMChannel) {
          return;
        }
        $.message.delete();
        const msgs = await $.channel.messages.fetch({
          limit: 100,
        });
        const travMessages = msgs.filter(
          (m) => m.author.id === $.client.user?.id,
        );

        await $.message.channel
          .send(`Found ${travMessages.size} messages to delete.`)
          .then((m) =>
            m.delete({
              timeout: 5000,
            }),
          );
        await $.message.channel.bulkDelete(travMessages);
      },
    }),
    nick: new Command({
      description: "Change the bot's nickname.",
      permission: Command.PERMISSIONS.BOT_SUPPORT,
      async run($: CommonLibrary): Promise<any> {
        const nickName = $.args.join(' ');
        const trav = $.guild?.members.cache.find(
          (member) => member.id === $.client.user?.id,
        );
        await trav?.setNickname(nickName);
        if (botHasPermission($.guild, Permissions.FLAGS.MANAGE_MESSAGES))
          $.message.delete({ timeout: 5000 }).catch($.handler.bind($));
        $.channel
          .send(`Nickname set to \`${nickName}\``)
          .then((m) => m.delete({ timeout: 5000 }));
      },
    }),
    guilds: new Command({
      description: 'Shows a list of all guilds the bot is a member of.',
      permission: Command.PERMISSIONS.BOT_SUPPORT,
      async run($: CommonLibrary): Promise<any> {
        const guildList = $.client.guilds.cache.array().map((e) => e.name);
        $.channel.send(guildList);
      },
    }),
    activity: new Command({
      description: 'Set the activity of the bot.',
      permission: Command.PERMISSIONS.BOT_SUPPORT,
      usage: '<type> <string>',
      async run($: CommonLibrary): Promise<any> {
        $.client.user?.setActivity('.help', {
          type: 'LISTENING',
        });
        $.channel.send('Activity set to default.');
      },
      any: new Command({
        description: `Select an activity type to set. Available levels: \`[${activities.join(
          ', ',
        )}]\``,
        async run($: CommonLibrary): Promise<any> {
          const type = $.args[0];

          if (activities.includes(type)) {
            $.client.user?.setActivity($.args.slice(1).join(' '), {
              type: $.args[0].toUpperCase(),
            });
            $.channel.send(
              `Set activity to \`${$.args[0].toUpperCase()}\` \`${$.args
                .slice(1)
                .join(' ')}\`.`,
            );
          } else
            $.channel.send(
              `Couldn't find an activity type named \`${type}\`! The available types are \`[${activities.join(
                ', ',
              )}]\`.`,
            );
        },
      }),
    }),
  },
});
