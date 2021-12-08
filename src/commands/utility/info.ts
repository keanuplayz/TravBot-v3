import {MessageEmbed, version, Guild, User, GuildMember, TextChannel, VoiceChannel} from "discord.js";
import ms from "ms";
import os from "os";
import {Command, NamedCommand, getUserByNickname, CHANNEL_TYPE, getGuildByName, RestCommand} from "onion-lasers";
import {formatBytes, trimArray} from "../../lib";
import {verificationLevels, filterLevels} from "../../defs/info";
import moment, {utc} from "moment";

export default new NamedCommand({
    description: "Command to provide all sorts of info about the current server, a user, etc.",
    async run({send, author, member}) {
        send({embeds: [await getUserInfo(author, member)]});
    },
    subcommands: {
        avatar: new NamedCommand({
            description: "Shows your own, or another user's avatar.",
            usage: "(<user>)",
            async run({send, author}) {
                send(author.displayAvatarURL({dynamic: true, size: 2048}));
            },
            id: "user",
            user: new Command({
                description: "Shows your own, or another user's avatar.",
                async run({send, args}) {
                    send(
                        args[0].displayAvatarURL({
                            dynamic: true,
                            size: 2048
                        })
                    );
                }
            }),
            any: new RestCommand({
                description: "Shows another user's avatar by searching their name",
                channelType: CHANNEL_TYPE.GUILD,
                async run({send, guild, combined}) {
                    const user = await getUserByNickname(combined, guild);

                    if (typeof user !== "string") {
                        send(
                            user.displayAvatarURL({
                                dynamic: true,
                                size: 2048
                            })
                        );
                    } else {
                        send(user);
                    }
                }
            })
        }),
        bot: new NamedCommand({
            description: "Displays info about the bot.",
            async run({send, guild, client}) {
                const core = os.cpus()[0];
                const embed = new MessageEmbed()
                    .setColor(guild?.me?.displayHexColor || "BLUE")
                    .addField(
                        "General",
                        [
                            `**❯ Client:** ${client.user?.tag} (${client.user?.id})`,
                            `**❯ Servers:** ${client.guilds.cache.size.toLocaleString()}`,
                            `**❯ Users:** ${client.guilds.cache
                                .reduce((a: any, b: {memberCount: any}) => a + b.memberCount, 0)
                                .toLocaleString()}`,
                            `**❯ Channels:** ${client.channels.cache.size.toLocaleString()}`,
                            `**❯ Creation Date:** ${utc(client.user?.createdTimestamp).format(
                                "Do MMMM YYYY HH:mm:ss"
                            )}`,
                            `**❯ Node.JS:** ${process.version}`,
                            `**❯ Version:** ${
                                process.env.npm_package_version
                                    ? `v${process.env.npm_package_version}`
                                    : "*Unable to fetch version, make sure to start the project via `npm start`, not `node`!*"
                            }`,
                            `**❯ Discord.JS:** v${version}`,
                            "\u200b"
                        ].join("\n")
                    )
                    .addField(
                        "System",
                        [
                            `**❯ Platform:** ${process.platform}`,
                            `**❯ Uptime:** ${ms(os.uptime() * 1000, {
                                long: true
                            })}`,
                            `**❯ CPU:**`,
                            `\u3000 • Cores: ${os.cpus().length}`,
                            `\u3000 • Model: ${core.model}`,
                            `\u3000 • Speed: ${core.speed}MHz`,
                            `**❯ Memory:**`,
                            `\u3000 • Total: ${formatBytes(process.memoryUsage().heapTotal)}`,
                            `\u3000 • Used: ${formatBytes(process.memoryUsage().heapUsed)}`
                        ].join("\n")
                    )
                    .setTimestamp();
                const avatarURL = client.user?.displayAvatarURL({
                    dynamic: true,
                    size: 2048
                });
                if (avatarURL) embed.setThumbnail(avatarURL);
                send({embeds: [embed]});
            }
        }),
        guild: new NamedCommand({
            description: "Displays info about the current guild or another guild.",
            usage: "(<guild name>/<guild ID>)",
            channelType: CHANNEL_TYPE.GUILD,
            async run({send, guild}) {
                send({embeds: [await getGuildInfo(guild!, guild)]});
            },
            id: "guild",
            guild: new Command({
                description: "Display info about a guild by its ID.",
                async run({send, guild, args}) {
                    const targetGuild = args[0] as Guild;
                    send({embeds: [await getGuildInfo(targetGuild, guild)]});
                }
            }),
            any: new RestCommand({
                description: "Display info about a guild by finding its name.",
                async run({send, guild, combined}) {
                    const targetGuild = getGuildByName(combined);

                    if (typeof targetGuild !== "string") {
                        send({embeds: [await getGuildInfo(targetGuild, guild)]});
                    } else {
                        send(targetGuild);
                    }
                }
            })
        })
    },
    id: "user",
    user: new Command({
        description: "Displays info about mentioned user.",
        async run({send, guild, args}) {
            const user = args[0] as User;
            // Transforms the User object into a GuildMember object of the current guild.
            const member = guild?.members.resolve(user);
            send({embeds: [await getUserInfo(user, member)]});
        }
    }),
    any: new RestCommand({
        description: "Displays info about a user by their nickname or username.",
        async run({send, guild, combined}) {
            const user = await getUserByNickname(combined, guild);
            // Transforms the User object into a GuildMember object of the current guild.
            const member = guild?.members.resolve(user);
            if (typeof user !== "string") send({embeds: [await getUserInfo(user, member)]});
            else send(user);
        }
    })
});

async function getUserInfo(user: User, member: GuildMember | null | undefined): Promise<MessageEmbed> {
    const userFlags = (await user.fetchFlags()).toArray();

    const embed = new MessageEmbed()
        .setThumbnail(user.displayAvatarURL({dynamic: true, size: 512}))
        .setColor("BLUE")
        .addField(
            "User",
            [
                `**❯ Username:** ${user.username}`,
                `**❯ Discriminator:** ${user.discriminator}`,
                `**❯ ID:** ${user.id}`,
                `**❯ Flags:** ${userFlags.length ? userFlags.join(", ") : "None"}`,
                `**❯ Avatar:** [Link to avatar](${user.displayAvatarURL({
                    dynamic: true
                })})`,
                `**❯ Time Created:** ${moment(user.createdTimestamp).format("LT")} ${moment(
                    user.createdTimestamp
                ).format("LL")} ${moment(user.createdTimestamp).fromNow()}`
            ].join("\n")
        );

    if (member) {
        const roles = member.roles.cache
            .sort((a: {position: number}, b: {position: number}) => b.position - a.position)
            .map((role: {toString: () => any}) => role.toString())
            .slice(0, -1);

        embed
            .setColor(member.displayHexColor)
            .addField(
                "Member",
                [
                    `**❯ Status:** ${member.presence?.status}`,
                    `**❯ Game:** ${member.presence?.activities ?? "Not playing a game."}`,
                    `**❯ Highest Role:** ${
                        member.roles.highest.id === member.guild.id ? "None" : member.roles.highest.name
                    }`,
                    `**❯ Server Join Date:** ${moment(member.joinedAt).format("LL LTS")}`,
                    `**❯ Hoist Role:** ${member.roles.hoist ? member.roles.hoist.name : "None"}`,
                    `**❯ Roles:** [${roles.length}]: ${
                        roles.length == 0 ? "None" : roles.length <= 10 ? roles.join(", ") : trimArray(roles).join(", ")
                    }`
                ].join("\n")
            );
    }

    return embed;
}

async function getGuildInfo(guild: Guild, currentGuild: Guild | null) {
    const members = await guild.members.fetch({
        withPresences: true,
        force: true
    });
    const roles = guild.roles.cache.sort((a, b) => b.position - a.position).map((role) => role.toString());
    const channels = guild.channels.cache;
    const emojis = guild.emojis.cache;
    const iconURL = guild.iconURL({dynamic: true});
    const embed = new MessageEmbed().setDescription(`**Guild information for __${guild.name}__**`).setColor("BLUE");
    const displayRoles = !!(currentGuild && guild.id === currentGuild.id);
    const owner = await guild.fetchOwner();

    embed
        .addField(
            "General",
            [
                `**❯ Name:** ${guild.name}`,
                `**❯ ID:** ${guild.id}`,
                `**❯ Owner:** ${owner.user.tag} (${guild.ownerId})`,
                `**❯ Boost Tier:** ${guild.premiumTier ? `Tier ${guild.premiumTier}` : "None"}`,
                `**❯ Explicit Filter:** ${filterLevels[guild.explicitContentFilter]}`,
                `**❯ Verification Level:** ${verificationLevels[guild.verificationLevel]}`,
                `**❯ Time Created:** ${moment(guild.createdTimestamp).format("LT")} ${moment(
                    guild.createdTimestamp
                ).format("LL")} ${moment(guild.createdTimestamp).fromNow()}`,
                "\u200b"
            ].join("\n")
        )
        .addField(
            "Statistics",
            [
                `**❯ Role Count:** ${roles.length}`,
                `**❯ Emoji Count:** ${emojis.size}`,
                `**❯ Regular Emoji Count:** ${emojis.filter((emoji) => !emoji.animated).size}`,
                `**❯ Animated Emoji Count:** ${emojis.filter((emoji) => !!emoji.animated).size}`,
                `**❯ Member Count:** ${guild.memberCount}`,
                `**❯ Humans:** ${members.filter((member) => !member.user.bot).size}`,
                `**❯ Bots:** ${members.filter((member) => member.user.bot).size}`,
                `**❯ Text Channels:** ${channels.filter((channel) => channel instanceof TextChannel).size}`,
                `**❯ Voice Channels:** ${channels.filter((channel) => channel instanceof VoiceChannel).size}`,
                `**❯ Boost Count:** ${guild.premiumSubscriptionCount || "0"}`,
                `\u200b`
            ].join("\n")
        )
        .addField(
            "Presence",
            [
                `**❯ Online:** ${members.filter((member) => member.presence?.status === "online").size}`,
                `**❯ Idle:** ${members.filter((member) => member.presence?.status === "idle").size}`,
                `**❯ Do Not Disturb:** ${members.filter((member) => member.presence?.status === "dnd").size}`,
                `**❯ Offline:** ${members.filter((member) => member.presence?.status === "offline").size}`,
                displayRoles ? "\u200b" : ""
            ].join("\n")
        )
        .setTimestamp();

    if (iconURL) embed.setThumbnail(iconURL);

    // Only add the roles if the guild the bot is sending the message to is the same one that's being requested.
    if (displayRoles) {
        embed.addField(
            `Roles [${roles.length - 1}]`,
            roles.length < 10 ? roles.join(", ") : roles.length > 10 ? trimArray(roles) : "None"
        );
    }

    return embed;
}
