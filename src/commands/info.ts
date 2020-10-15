import { Guild, MessageEmbed } from 'discord.js';
import moment from 'moment';
import Command from '../core/command';
import { CommonLibrary } from '../core/lib';
import { verificationLevels, filterLevels, regions, flags } from '../defs/info';

export default new Command({
  description:
    'Command to provide all sorts of info about the current server, a user, etc.',
  run: 'Please provide an argument.\nFor help, run `%prefix%help info`.',
  subcommands: {
    avatar: new Command({
      description: "Shows your own, or another user's avatar.",
      usage: '(<user>)',
      async run($: CommonLibrary): Promise<any> {
        $.channel.send(
          $.author.displayAvatarURL({ dynamic: true, size: 2048 }),
        );
      },
      user: new Command({
        description: "Shows your own, or another user's avatar.",
        async run($: CommonLibrary): Promise<any> {
          $.channel.send(
            $.args[0].displayAvatarURL({ dynamic: true, size: 2048 }),
          );
        },
      }),
    }),

    guild: new Command({
      description: 'Displays info about the current guild.',
      async run($: CommonLibrary): Promise<any> {
        if ($.guild) {
          const roles = $.guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .map((role) => role.toString());
          const members = $.guild.members.cache;
          const channels = $.guild.channels.cache;
          const emojis = $.guild.emojis.cache;

          const iconURL = $.guild.iconURL({ dynamic: true });
          const embed = new MessageEmbed()
            .setDescription(`**Guild information for __${$.guild.name}__**`)
            .setColor('BLUE');
          if (iconURL)
            embed
              .setThumbnail(iconURL)
              .addField('General', [
                `**❯ Name:** ${$.guild.name}`,
                `**❯ ID:** ${$.guild.id}`,
                `**❯ Owner:** ${$.guild.owner?.user.tag} (${$.guild.ownerID})`,
                `**❯ Region:** ${regions[$.guild.region]}`,
                `**❯ Boost Tier:** ${
                  $.guild.premiumTier ? `Tier ${$.guild.premiumTier}` : 'None'
                }`,
                `**❯ Explicit Filter:** ${
                  filterLevels[$.guild.explicitContentFilter]
                }`,
                `**❯ Verification Level:** ${
                  verificationLevels[$.guild.verificationLevel]
                }`,
                `**❯ Time Created:** ${moment($.guild.createdTimestamp).format(
                  'LT',
                )} ${moment($.guild.createdTimestamp).format('LL')} ${moment(
                  $.guild.createdTimestamp,
                ).fromNow()})`,
                '\u200b',
              ])
              .addField('Statistics', [
                `**❯ Role Count:** ${roles.length}`,
                `**❯ Emoji Count:** ${emojis.size}`,
                `**❯ Regular Emoji Count:** ${
                  emojis.filter((emoji) => !emoji.animated).size
                }`,
                `**❯ Animated Emoji Count:** ${
                  emojis.filter((emoji) => emoji.animated).size
                }`,
                `**❯ Member Count:** ${$.guild.memberCount}`,
                `**❯ Humans:** ${
                  members.filter((member) => !member.user.bot).size
                }`,
                `**❯ Bots:** ${
                  members.filter((member) => member.user.bot).size
                }`,
                `**❯ Text Channels:** ${
                  channels.filter((channel) => channel.type === 'text').size
                }`,
                `**❯ Voice Channels:** ${
                  channels.filter((channel) => channel.type === 'voice').size
                }`,
                `**❯ Boost Count:** ${$.guild.premiumSubscriptionCount || '0'}`,
                `\u200b`,
              ])
              .addField('Presence', [
                `**❯ Online:** ${
                  members.filter(
                    (member) => member.presence.status === 'online',
                  ).size
                }`,
                `**❯ Idle:** ${
                  members.filter((member) => member.presence.status === 'idle')
                    .size
                }`,
                `**❯ Do Not Disturb:** ${
                  members.filter((member) => member.presence.status === 'dnd')
                    .size
                }`,
                `**❯ Offline:** ${
                  members.filter(
                    (member) => member.presence.status === 'offline',
                  ).size
                }`,
                '\u200b',
              ])
              .addField(
                `Roles [${roles.length - 1}]`,
                roles.length < 10
                  ? roles.join(', ')
                  : roles.length > 10
                  ? this.client.utils.trimArray(roles)
                  : 'None',
              )
              .setTimestamp();

          $.channel.send(embed);
        } else {
          $.channel.send('Please execute this command in a guild.');
        }
      },
    }),
  },
  user: new Command({
    description: 'Displays info about mentioned user.',
    async run($: CommonLibrary): Promise<any> {
      // Transforms the User object into a GuildMember object of the current guild.
      const member = $.guild?.members.resolve($.args[0]);

      if (!member)
        return $.channel.send(
          'No member object was found by that user! Are you sure you used this command in a server?',
        );

      const roles = member.roles.cache
        .sort(
          (a: { position: number }, b: { position: number }) =>
            b.position - a.position,
        )
        .map((role: { toString: () => any }) => role.toString())
        .slice(0, -1);
      // @ts-ignore - Discord.js' typings seem to be outdated here. According to their v12 docs, it's User.fetchFlags() instead of User.flags.
      const userFlags = ((await member.user.fetchFlags()) as UserFlags).toArray();

      const embed = new MessageEmbed()
        .setThumbnail(
          member.user.displayAvatarURL({ dynamic: true, size: 512 }),
        )
        .setColor(member.displayHexColor || 'BLUE')
        .addField('User', [
          `**❯ Username:** ${member.user.username}`,
          `**❯ Discriminator:** ${member.user.discriminator}`,
          `**❯ ID:** ${member.id}`,
          `**❯ Flags:** ${userFlags.length ? userFlags.join(', ') : 'None'}`,
          `**❯ Avatar:** [Link to avatar](${member.user.displayAvatarURL({
            dynamic: true,
          })})`,
          `**❯ Time Created:** ${moment(member.user.createdTimestamp).format(
            'LT',
          )} ${moment(member.user.createdTimestamp).format('LL')} ${moment(
            member.user.createdTimestamp,
          ).fromNow()}`,
          `**❯ Status:** ${member.user.presence.status}`,
          `**❯ Game:** ${
            member.user.presence.activities || 'Not playing a game.'
          }`,
        ])
        .addField('Member', [
          `**❯ Highest Role:** ${
            member.roles.highest.id === $.guild?.id
              ? 'None'
              : member.roles.highest.name
          }`,
          `**❯ Server Join Date:** ${moment(member.joinedAt).format('LL LTS')}`,
          `**❯ Hoist Role:** ${
            member.roles.hoist ? member.roles.hoist.name : 'None'
          }`,
          `**❯ Roles:** [${roles.length}]: ${
            roles.length < 10
              ? roles.join(', ')
              : roles.length > 10
              ? this.client.utils.trimArray(roles)
              : 'None'
          }`,
        ]);
      $.channel.send(embed);
    },
  }),
});
