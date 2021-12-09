import {Command, NamedCommand, getPermissionLevel, getPermissionName, CHANNEL_TYPE, RestCommand} from "onion-lasers";
import {config, Guild, getPrefix} from "../../lib";
import {Permissions, TextChannel, User, Role, Channel, Util} from "discord.js";
import {logs} from "../../modules/logger";

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
    async run({send, author, member}) {
        const permLevel = getPermissionLevel(author, member);
        return send(`${author}, your permission level is \`${getPermissionName(permLevel)}\` (${permLevel}).`);
    },
    subcommands: {
        set: new NamedCommand({
            description: "Set different per-guild settings for the bot.",
            run: "You have to specify the option you want to set.",
            permission: PERMISSIONS.ADMIN,
            channelType: CHANNEL_TYPE.GUILD,
            subcommands: {
                prefix: new NamedCommand({
                    description: "Set a custom prefix for your guild. Removes your custom prefix if none is provided.",
                    usage: "(<prefix>) (<@bot>)",
                    async run({send, guild}) {
                        new Guild(guild!.id).prefix = null;
                        send(
                            `The custom prefix for this guild has been removed. My prefix is now back to \`${getPrefix()}\`.`
                        );
                    },
                    any: new Command({
                        async run({send, guild, args}) {
                            new Guild(guild!.id).prefix = args[0];
                            send(`The custom prefix for this guild is now \`${args[0]}\`.`);
                        },
                        user: new Command({
                            description: "Specifies the bot in case of conflicting prefixes.",
                            async run({send, guild, client, args}) {
                                if ((args[1] as User).id === client.user!.id) {
                                    new Guild(guild!.id).prefix = args[0];
                                    send(`The custom prefix for this guild is now \`${args[0]}\`.`);
                                }
                            }
                        })
                    })
                }),
                messageembeds: new NamedCommand({
                    description: "Enable or disable sending message previews.",
                    usage: "enable/disable",
                    run: "Please specify `enable` or `disable`.",
                    subcommands: {
                        true: new NamedCommand({
                            description: "Enable sending of message previews.",
                            async run({send, guild}) {
                                new Guild(guild!.id).hasMessageEmbeds = true;
                                send("Sending of message previews has been enabled.");
                            }
                        }),
                        false: new NamedCommand({
                            description: "Disable sending of message previews.",
                            async run({send, guild}) {
                                new Guild(guild!.id).hasMessageEmbeds = false;
                                send("Sending of message previews has been disabled.");
                            }
                        })
                    }
                }),
                autoroles: new NamedCommand({
                    description: "Configure your server's autoroles.",
                    usage: "<roles...>",
                    async run({send, guild}) {
                        new Guild(guild!.id).autoRoles = [];
                        send("Reset this server's autoroles.");
                    },
                    id: "role",
                    any: new RestCommand({
                        description: "The roles to set as autoroles.",
                        async run({send, guild, args}) {
                            const guildd = new Guild(guild!.id);
                            for (const role of args) {
                                if (!role.toString().match(/^<@&(\d{17,})>$/)) {
                                    return send("Not all arguments are a role mention!");
                                }
                                const id = role.toString().match(/^<@&(\d{17,})>$/)![1];
                                guildd.autoRoles!.push(id);
                            }
                            return send("Saved.");
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
                            async run({send, guild}) {
                                new Guild(guild!.id).welcomeType = "none";
                                send("Set this server's welcome type to `none`.");
                            },
                            // I should probably make this a bit more dynamic... Oh well.
                            subcommands: {
                                text: new NamedCommand({
                                    async run({send, guild}) {
                                        new Guild(guild!.id).welcomeType = "text";
                                        send("Set this server's welcome type to `text`.");
                                    }
                                }),
                                graphical: new NamedCommand({
                                    async run({send, guild}) {
                                        new Guild(guild!.id).welcomeType = "graphical";
                                        send("Set this server's welcome type to `graphical`.");
                                    }
                                }),
                                none: new NamedCommand({
                                    async run({send, guild}) {
                                        new Guild(guild!.id).welcomeType = "none";
                                        send("Set this server's welcome type to `none`.");
                                    }
                                })
                            }
                        }),
                        channel: new NamedCommand({
                            description: "Sets the welcome channel for your server. Type `#` to reference the channel.",
                            usage: "(<channel mention>)",
                            async run({send, channel, guild}) {
                                new Guild(guild!.id).welcomeChannel = channel.id;
                                send(`Successfully set ${channel} as the welcome channel for this server.`);
                            },
                            id: "channel",
                            channel: new Command({
                                async run({send, guild, args}) {
                                    const result = args[0] as Channel;

                                    if (result instanceof TextChannel) {
                                        new Guild(guild!.id).welcomeChannel = result.id;
                                        send(`Successfully set this server's welcome channel to ${result}.`);
                                    } else {
                                        send(`\`${result.id}\` is not a valid text channel!`);
                                    }
                                }
                            })
                        }),
                        message: new NamedCommand({
                            description:
                                "Sets a custom welcome message for your server. Use `%user%` as the placeholder for the user.",
                            usage: "(<message>)",
                            async run({send, guild}) {
                                new Guild(guild!.id).welcomeMessage = null;
                                send("Reset your server's welcome message to the default.");
                            },
                            any: new RestCommand({
                                async run({send, guild, combined}) {
                                    new Guild(guild!.id).welcomeMessage = combined;
                                    send(`Set your server's welcome message to \`${combined}\`.`);
                                }
                            })
                        })
                    }
                }),
                stream: new NamedCommand({
                    description: "Set a channel to send stream notifications. Type `#` to reference the channel.",
                    usage: "(<channel mention>)",
                    async run({send, channel, guild}) {
                        const targetGuild = new Guild(guild!.id);

                        if (targetGuild.streamingChannel) {
                            targetGuild.streamingChannel = null;
                            send("Removed your server's stream notifications channel.");
                        } else {
                            targetGuild.streamingChannel = channel.id;
                            send(`Set your server's stream notifications channel to ${channel}.`);
                        }
                    },
                    id: "channel",
                    channel: new Command({
                        async run({send, guild, args}) {
                            const result = args[0] as Channel;

                            if (result instanceof TextChannel) {
                                new Guild(guild!.id).streamingChannel = result.id;
                                send(`Successfully set this server's stream notifications channel to ${result}.`);
                            } else {
                                send(`\`${result.id}\` is not a valid text channel!`);
                            }
                        }
                    })
                }),
                streamrole: new NamedCommand({
                    description: "Sets/removes a stream notification role (and the corresponding category name)",
                    usage: "set/remove <...>",
                    run: "You need to enter in a role.",
                    subcommands: {
                        set: new NamedCommand({
                            usage: "<role> <category>",
                            id: "role",
                            role: new Command({
                                run: "You need to enter a category name.",
                                any: new RestCommand({
                                    async run({send, guild, args, combined}) {
                                        const role = args[0] as Role;
                                        new Guild(guild!.id).setStreamingRole(role.id, combined);
                                        send(
                                            `Successfully set the category \`${combined}\` to notify \`${role.name}\`.`
                                        );
                                    }
                                })
                            })
                        }),
                        remove: new NamedCommand({
                            usage: "<role>",
                            id: "role",
                            role: new Command({
                                async run({send, guild, args}) {
                                    const role = args[0] as Role;
                                    const guildStorage = new Guild(guild!.id);
                                    const category = guildStorage.getStreamingRole(role.id);
                                    if (guildStorage.removeStreamingRole(role.id)) {
                                        send(
                                            `Successfully removed the category \`${category}\` to notify \`${role.name}\`.`
                                        );
                                    } else {
                                        send(`Failed to remove streaming role \`${role.id}\` (\`${category}\`).`);
                                    }
                                }
                            })
                        })
                    }
                }),
                name: new NamedCommand({
                    aliases: ["defaultname"],
                    description:
                        "Sets the name that the channel will be reset to once no more members are in the channel.",
                    usage: "(<name>)",
                    async run({send, guild, message}) {
                        const voiceChannel = message.member?.voice.channel;
                        if (!voiceChannel) return send("You are not in a voice channel.");
                        const guildStorage = new Guild(guild!.id);

                        if (guildStorage.removeDefaultChannelName(voiceChannel.id)) {
                            send(`Successfully removed the default channel name for ${voiceChannel}.`);
                        } else {
                            send(`Failed to remove the default channel name for ${voiceChannel}`);
                        }
                    },
                    any: new RestCommand({
                        async run({send, guild, message, combined}) {
                            const voiceChannel = message.member?.voice.channel;
                            const guildID = guild!.id;
                            const guildStorage = new Guild(guildID);
                            const newName = combined;

                            if (!voiceChannel) return send("You are not in a voice channel.");
                            if (!guild!.me?.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS))
                                return send("I can't change channel names without the `Manage Channels` permission.");

                            guildStorage.setDefaultChannelName(voiceChannel.id, newName);
                            return await send(`Set default channel name to "${newName}".`);
                        }
                    })
                })
            }
        }),
        diag: new NamedCommand({
            description: 'Requests a debug log with the "info" verbosity level.',
            permission: PERMISSIONS.BOT_SUPPORT,
            async run({send}) {
                send(getLogBuffer("info"));
            },
            any: new Command({
                description: `Select a verbosity to listen to. Available levels: \`[${Object.keys(logs).join(", ")}]\``,
                async run({send, args}) {
                    const type = args[0];

                    if (type in logs) send(getLogBuffer(type));
                    else
                        send(
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
            async run({send}) {
                send("Setting status to `online`...");
            },
            any: new Command({
                description: `Select a status to set to. Available statuses: \`[${statuses.join(", ")}]\`.`,
                async run({send, client, args}) {
                    if (!statuses.includes(args[0])) {
                        return send("That status doesn't exist!");
                    } else {
                        client.user?.setStatus(args[0]);
                        return send(`Setting status to \`${args[0]}\`...`);
                    }
                }
            })
        }),
        purge: new NamedCommand({
            description: "Purges the bot's own messages.",
            permission: PERMISSIONS.BOT_SUPPORT,
            channelType: CHANNEL_TYPE.GUILD,
            async run({send, message, channel, guild, client}) {
                // It's probably better to go through the bot's own messages instead of calling bulkDelete which requires MANAGE_MESSAGES.
                if (guild!.me?.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
                    message.delete();
                    const msgs = await channel.messages.fetch({
                        limit: 100
                    });
                    const travMessages = msgs.filter((m) => m.author.id === client.user?.id);

                    await send(`Found ${travMessages.size} messages to delete.`).then((m) => {
                        setTimeout(() => {
                            m.delete();
                        }, 5000);
                    });
                    await (channel as TextChannel).bulkDelete(travMessages);
                } else {
                    send("This command must be executed in a guild where I have the `MANAGE_MESSAGES` permission.");
                }
            }
        }),
        clear: new NamedCommand({
            description: "Clears a given amount of messages.",
            usage: "<amount>",
            channelType: CHANNEL_TYPE.GUILD,
            run: "A number was not provided.",
            number: new Command({
                description: "Amount of messages to delete.",
                async run({message, channel, args}) {
                    message.delete();
                    const fetched = await channel.messages.fetch({
                        limit: args[0]
                    });
                    return await (channel as TextChannel).bulkDelete(fetched);
                }
            })
        }),
        // TODO: Reimplement this entire command, for `send` doesn't allow
        // types like `unknown` to be sent anymore. Perhaps try to echo
        // whatever `evaled` is into an empty buffer and send this.
        // (see: `Buffer.alloc(...)`) This is unlikely to work though, since
        // `Buffer.alloc(...)` requires a length, which we can't retrieve from
        // an `unknown` variable.
        // eval: new NamedCommand({
        //     description: "Evaluate code.",
        //     usage: "<code>",
        //     permission: PERMISSIONS.BOT_OWNER,
        //     run: "You have to enter some code to execute first.",
        //     any: new RestCommand({
        //         // You have to bring everything into scope to use them. AFAIK, there isn't a more maintainable way to do this, but at least TS will let you know if anything gets removed.
        //         async run({send, message, channel, guild, author, member, client, args, combined}) {
        //             try {
        //                 let evaled: unknown = eval(combined);
        //                 // If promises like message.channel.send() are invoked, await them so unnecessary error reports don't leak into the command handler.
        //                 // Also, it's more useful to see the value rather than Promise { <pending> }.
        //                 if (evaled instanceof Promise) evaled = await evaled;
        //                 if (typeof evaled !== "string") evaled = inspect(evaled);
        //                 // Also await this send call so that if the message is empty, it doesn't leak into the command handler.
        //                 await send(clean(evaled), {code: "js", split: true});
        //             } catch (err) {
        //                 send(clean(err), {code: "js", split: true});
        //             }
        //         }
        //     })
        // }),
        nick: new NamedCommand({
            description: "Change the bot's nickname.",
            permission: PERMISSIONS.BOT_SUPPORT,
            channelType: CHANNEL_TYPE.GUILD,
            run: "You have to specify a nickname to set for the bot",
            any: new RestCommand({
                async run({send, guild, combined}) {
                    await guild!.me?.setNickname(combined);
                    send(`Nickname set to \`${combined}\``);
                }
            })
        }),
        guilds: new NamedCommand({
            description: "Shows a list of all guilds the bot is a member of.",
            permission: PERMISSIONS.BOT_SUPPORT,
            async run({send, client}) {
                const guildList = Util.splitMessage(
                    Array.from(client.guilds.cache.map((e) => e.name).values()).join("\n")
                );
                for (const guildListPart of guildList) {
                    send(guildListPart);
                }
            }
        }),
        activity: new NamedCommand({
            description: "Set the activity of the bot.",
            permission: PERMISSIONS.BOT_SUPPORT,
            usage: "<type> <string>",
            async run({send, client}) {
                client.user?.setActivity(".help", {
                    type: "LISTENING"
                });
                send("Activity set to default.");
            },
            any: new RestCommand({
                description: `Select an activity type to set. Available levels: \`[${activities.join(", ")}]\``,
                async run({send, client, args}) {
                    const type = args[0];

                    if (activities.includes(type)) {
                        client.user?.setActivity(args.slice(1).join(" "), {
                            type: args[0].toUpperCase()
                        });
                        send(`Set activity to \`${args[0].toUpperCase()}\` \`${args.slice(1).join(" ")}\`.`);
                    } else
                        send(
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
            channelType: CHANNEL_TYPE.GUILD,
            async run({send, channel}) {
                config.systemLogsChannel = channel.id;
                send(`Successfully set ${channel} as the system logs channel.`);
            },
            channel: new Command({
                async run({send, args}) {
                    const targetChannel = args[0] as Channel;

                    if (targetChannel instanceof TextChannel) {
                        config.systemLogsChannel = targetChannel.id;
                        send(`Successfully set ${targetChannel} as the system logs channel.`);
                    } else {
                        send(`\`${targetChannel.id}\` is not a valid text channel!`);
                    }
                }
            })
        })
    }
});
