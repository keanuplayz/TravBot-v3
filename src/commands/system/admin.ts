import {Command, NamedCommand, botHasPermission, getPermissionLevel, getPermissionName} from "../../core";
import {clean} from "../../lib";
import {Config, Storage} from "../../structures";
import {Permissions} from "discord.js";
import {logs} from "../../modules/globals";

function getLogBuffer(type: string) {
    return {
        files: [
            {
                attachment: Buffer.alloc(logs[type].length, logs[type]),
                name: `${Date.now()}.${type}.log`
            }
        ]
    };
}

const activities = ["playing", "listening", "streaming", "watching"];
const statuses = ["online", "idle", "dnd", "invisible"];

export default new NamedCommand({
    description:
        "An all-in-one command to do admin stuff. You need to be either an admin of the server or one of the bot's mechanics to use this command.",
    async run({message, channel, guild, author, member, client, args}) {
        if (!member)
            return channel.send("Couldn't find a member object for you! Did you make sure you used this in a server?");
        const permLevel = getPermissionLevel(author, member);
        return channel.send(`${author}, your permission level is \`${getPermissionName(permLevel)}\` (${permLevel}).`);
    },
    subcommands: {
        set: new NamedCommand({
            description: "Set different per-guild settings for the bot.",
            run: "You have to specify the option you want to set.",
            permission: PERMISSIONS.ADMIN,
            subcommands: {
                prefix: new NamedCommand({
                    description: "Set a custom prefix for your guild. Removes your custom prefix if none is provided.",
                    usage: "(<prefix>)",
                    async run({message, channel, guild, author, member, client, args}) {
                        Storage.getGuild(guild?.id || "N/A").prefix = null;
                        Storage.save();
                        channel.send(
                            `The custom prefix for this guild has been removed. My prefix is now back to \`${Config.prefix}\`.`
                        );
                    },
                    any: new Command({
                        async run({message, channel, guild, author, member, client, args}) {
                            Storage.getGuild(guild?.id || "N/A").prefix = args[0];
                            Storage.save();
                            channel.send(`The custom prefix for this guild is now \`${args[0]}\`.`);
                        }
                    })
                }),
                welcome: new NamedCommand({
                    description: "Configure your server's welcome settings for the bot.",
                    usage: "type/channel <...>",
                    run: "You need to specify which part to modify, `type`/`channel`.",
                    subcommands: {
                        type: new NamedCommand({
                            description:
                                "Sets how welcome messages are displayed for your server. Removes welcome messages if unspecified.",
                            usage: "`none`/`text`/`graphical`",
                            async run({message, channel, guild, author, member, client, args}) {
                                if (guild) {
                                    Storage.getGuild(guild.id).welcomeType = "none";
                                    Storage.save();
                                    channel.send("Set this server's welcome type to `none`.");
                                } else {
                                    channel.send("You must use this command in a server.");
                                }
                            },
                            // I should probably make this a bit more dynamic... Oh well.
                            subcommands: {
                                text: new NamedCommand({
                                    async run({message, channel, guild, author, member, client, args}) {
                                        if (guild) {
                                            Storage.getGuild(guild.id).welcomeType = "text";
                                            Storage.save();
                                            channel.send("Set this server's welcome type to `text`.");
                                        } else {
                                            channel.send("You must use this command in a server.");
                                        }
                                    }
                                }),
                                graphical: new NamedCommand({
                                    async run({message, channel, guild, author, member, client, args}) {
                                        if (guild) {
                                            Storage.getGuild(guild.id).welcomeType = "graphical";
                                            Storage.save();
                                            channel.send("Set this server's welcome type to `graphical`.");
                                        } else {
                                            channel.send("You must use this command in a server.");
                                        }
                                    }
                                })
                            }
                        }),
                        channel: new NamedCommand({
                            description: "Sets the welcome channel for your server. Type `#` to reference the channel.",
                            usage: "(<channel mention>)",
                            async run({message, channel, guild, author, member, client, args}) {
                                if (guild) {
                                    Storage.getGuild(guild.id).welcomeChannel = channel.id;
                                    Storage.save();
                                    channel.send(`Successfully set ${channel} as the welcome channel for this server.`);
                                } else {
                                    channel.send("You must use this command in a server.");
                                }
                            },
                            // If/when channel types come out, this will be the perfect candidate to test it.
                            any: new Command({
                                async run({message, channel, guild, author, member, client, args}) {
                                    if (guild) {
                                        const match = args[0].match(/^<#(\d{17,19})>$/);

                                        if (match) {
                                            Storage.getGuild(guild.id).welcomeChannel = match[1];
                                            Storage.save();
                                            channel.send(
                                                `Successfully set this server's welcome channel to ${match[0]}.`
                                            );
                                        } else {
                                            channel.send(
                                                "You must provide a reference channel. You can do this by typing `#` then searching for the proper channel."
                                            );
                                        }
                                    } else {
                                        channel.send("You must use this command in a server.");
                                    }
                                }
                            })
                        }),
                        message: new NamedCommand({
                            description:
                                "Sets a custom welcome message for your server. Use `%user%` as the placeholder for the user.",
                            usage: "(<message>)",
                            async run({message, channel, guild, author, member, client, args}) {
                                if (guild) {
                                    Storage.getGuild(guild.id).welcomeMessage = null;
                                    Storage.save();
                                    channel.send("Reset your server's welcome message to the default.");
                                } else {
                                    channel.send("You must use this command in a server.");
                                }
                            },
                            any: new Command({
                                async run({message, channel, guild, author, member, client, args}) {
                                    if (guild) {
                                        const message = args.join(" ");
                                        Storage.getGuild(guild.id).welcomeMessage = message;
                                        Storage.save();
                                        channel.send(`Set your server's welcome message to \`${message}\`.`);
                                    } else {
                                        channel.send("You must use this command in a server.");
                                    }
                                }
                            })
                        })
                    }
                })
            }
        }),
        diag: new NamedCommand({
            description: 'Requests a debug log with the "info" verbosity level.',
            permission: PERMISSIONS.BOT_SUPPORT,
            async run({message, channel, guild, author, member, client, args}) {
                channel.send(getLogBuffer("info"));
            },
            any: new Command({
                description: `Select a verbosity to listen to. Available levels: \`[${Object.keys(logs).join(", ")}]\``,
                async run({message, channel, guild, author, member, client, args}) {
                    const type = args[0];

                    if (type in logs) channel.send(getLogBuffer(type));
                    else
                        channel.send(
                            `Couldn't find a verbosity level named \`${type}\`! The available types are \`[${Object.keys(
                                logs
                            ).join(", ")}]\`.`
                        );
                }
            })
        }),
        status: new NamedCommand({
            description: "Changes the bot's status.",
            permission: PERMISSIONS.BOT_SUPPORT,
            async run({message, channel, guild, author, member, client, args}) {
                channel.send("Setting status to `online`...");
            },
            any: new Command({
                description: `Select a status to set to. Available statuses: \`[${statuses.join(", ")}]\`.`,
                async run({message, channel, guild, author, member, client, args}) {
                    if (!statuses.includes(args[0])) {
                        return channel.send("That status doesn't exist!");
                    } else {
                        client.user?.setStatus(args[0]);
                        return channel.send(`Setting status to \`${args[0]}\`...`);
                    }
                }
            })
        }),
        purge: new NamedCommand({
            description: "Purges the bot's own messages.",
            permission: PERMISSIONS.BOT_SUPPORT,
            async run({message, channel, guild, author, member, client, args}) {
                // It's probably better to go through the bot's own messages instead of calling bulkDelete which requires MANAGE_MESSAGES.
                if (botHasPermission(guild, Permissions.FLAGS.MANAGE_MESSAGES) && channel.type !== "dm") {
                    message.delete();
                    const msgs = await channel.messages.fetch({
                        limit: 100
                    });
                    const travMessages = msgs.filter((m) => m.author.id === client.user?.id);

                    await channel.send(`Found ${travMessages.size} messages to delete.`).then((m) =>
                        m.delete({
                            timeout: 5000
                        })
                    );
                    await channel.bulkDelete(travMessages);
                } else {
                    channel.send(
                        "This command must be executed in a guild where I have the `MANAGE_MESSAGES` permission."
                    );
                }
            }
        }),
        clear: new NamedCommand({
            description: "Clears a given amount of messages.",
            usage: "<amount>",
            run: "A number was not provided.",
            number: new Command({
                description: "Amount of messages to delete.",
                async run({message, channel, guild, author, member, client, args}) {
                    if (channel.type === "dm") return channel.send("Can't clear messages in the DMs!");
                    message.delete();
                    const fetched = await channel.messages.fetch({
                        limit: args[0]
                    });
                    await channel.bulkDelete(fetched);
                    return;
                }
            })
        }),
        eval: new NamedCommand({
            description: "Evaluate code.",
            usage: "<code>",
            permission: PERMISSIONS.BOT_OWNER,
            // You have to bring everything into scope to use them. AFAIK, there isn't a more maintainable way to do this, but at least TS will let you know if anything gets removed.
            async run({message, channel, guild, author, member, client, args}) {
                try {
                    const code = args.join(" ");
                    let evaled = eval(code);

                    if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
                    channel.send(clean(evaled), {code: "js", split: true});
                } catch (err) {
                    channel.send(clean(err), {code: "js", split: true});
                }
            }
        }),
        nick: new NamedCommand({
            description: "Change the bot's nickname.",
            permission: PERMISSIONS.BOT_SUPPORT,
            async run({message, channel, guild, author, member, client, args}) {
                const nickName = args.join(" ");
                await guild?.me?.setNickname(nickName);
                if (botHasPermission(guild, Permissions.FLAGS.MANAGE_MESSAGES)) message.delete({timeout: 5000});
                channel.send(`Nickname set to \`${nickName}\``).then((m) => m.delete({timeout: 5000}));
            }
        }),
        guilds: new NamedCommand({
            description: "Shows a list of all guilds the bot is a member of.",
            permission: PERMISSIONS.BOT_SUPPORT,
            async run({message, channel, guild, author, member, client, args}) {
                const guildList = client.guilds.cache.array().map((e) => e.name);
                channel.send(guildList, {split: true});
            }
        }),
        activity: new NamedCommand({
            description: "Set the activity of the bot.",
            permission: PERMISSIONS.BOT_SUPPORT,
            usage: "<type> <string>",
            async run({message, channel, guild, author, member, client, args}) {
                client.user?.setActivity(".help", {
                    type: "LISTENING"
                });
                channel.send("Activity set to default.");
            },
            any: new Command({
                description: `Select an activity type to set. Available levels: \`[${activities.join(", ")}]\``,
                async run({message, channel, guild, author, member, client, args}) {
                    const type = args[0];

                    if (activities.includes(type)) {
                        client.user?.setActivity(args.slice(1).join(" "), {
                            type: args[0].toUpperCase()
                        });
                        channel.send(`Set activity to \`${args[0].toUpperCase()}\` \`${args.slice(1).join(" ")}\`.`);
                    } else
                        channel.send(
                            `Couldn't find an activity type named \`${type}\`! The available types are \`[${activities.join(
                                ", "
                            )}]\`.`
                        );
                }
            })
        }),
        syslog: new NamedCommand({
            description: "Sets up the current channel to receive system logs.",
            permission: PERMISSIONS.BOT_ADMIN,
            async run({message, channel, guild, author, member, client, args}) {
                if (guild) {
                    Config.systemLogsChannel = channel.id;
                    Config.save();
                    channel.send(`Successfully set ${channel} as the system logs channel.`);
                } else {
                    channel.send("DM system log channels aren't supported.");
                }
            }
        })
    }
});
