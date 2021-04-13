import {NamedCommand, CHANNEL_TYPE} from "onion-lasers";
import {pluralise} from "../../lib";
import moment from "moment";
import {Collection, TextChannel} from "discord.js";

const lastUsedTimestamps = new Collection<string, number>();

export default new NamedCommand({
    description:
        "Scans all text channels in the current guild and returns the number of times each emoji specific to the guild has been used. Has a cooldown of 24 hours per guild.",
    channelType: CHANNEL_TYPE.GUILD,
    async run({send, message, channel, guild}) {
        // Test if the command is on cooldown. This isn't the strictest cooldown possible, because in the event that the bot crashes, the cooldown will be reset. But for all intends and purposes, it's a good enough cooldown. It's a per-server cooldown.
        const startTime = Date.now();
        const cooldown = 86400000; // 24 hours
        const lastUsedTimestamp = lastUsedTimestamps.get(guild!.id) ?? 0;
        const difference = startTime - lastUsedTimestamp;
        const howLong = moment(startTime).to(lastUsedTimestamp + cooldown);

        // If it's been less than an hour since the command was last used, prevent it from executing.
        if (difference < cooldown)
            return send(`This command requires a day to cooldown. You'll be able to activate this command ${howLong}.`);
        else lastUsedTimestamps.set(guild!.id, startTime);

        const stats: {
            [id: string]: {
                name: string;
                formatted: string;
                users: number;
                bots: number;
            };
        } = {};
        let totalUserEmoteUsage = 0;
        // IMPORTANT: You MUST check if the bot actually has access to the channel in the first place. It will get the list of all channels, but that doesn't mean it has access to every channel. Without this, it'll require admin access and throw an annoying unhelpful DiscordAPIError: Missing Access otherwise.
        const allTextChannelsInCurrentGuild = guild!.channels.cache.filter(
            (channel) => channel.type === "text" && channel.viewable
        ) as Collection<string, TextChannel>;
        let messagesSearched = 0;
        let channelsSearched = 0;
        let currentChannelName = "";
        const totalChannels = allTextChannelsInCurrentGuild.size;
        const statusMessage = await send("Gathering emotes...");
        let warnings = 0;
        channel.startTyping();

        // Initialize the emote stats object with every emote in the current guild.
        // The goal here is to cut the need to access guild.emojis.get() which'll make it faster and easier to work with.
        for (let emote of guild!.emojis.cache.values()) {
            // If you don't include the "a" for animated emotes, it'll not only not show up, but also cause all other emotes in the same message to not show up. The emote name is self-correcting but it's better to keep the right value since it'll be used to calculate message lengths that fit.
            stats[emote.id] = {
                name: emote.name,
                formatted: `<${emote.animated ? "a" : ""}:${emote.name}:${emote.id}>`,
                users: 0,
                bots: 0
            };
        }

        const interval = setInterval(() => {
            statusMessage.edit(
                `Searching channel \`${currentChannelName}\`... (${messagesSearched} messages scanned, ${channelsSearched}/${totalChannels} channels scanned)`
            );
        }, 5000);

        for (const channel of allTextChannelsInCurrentGuild.values()) {
            currentChannelName = channel.name;
            let selected = channel.lastMessageID ?? message.id;
            let continueLoop = true;

            while (continueLoop) {
                // Unfortunately, any kind of .fetch call is limited to 100 items at once by Discord's API.
                const messages = await channel.messages.fetch({
                    limit: 100,
                    before: selected
                });

                if (messages.size > 0) {
                    for (const msg of messages.values()) {
                        // It's very important to not capture an array of matches then do \d+ on each item because emote names can have numbers in them, causing the bot to not count them correctly.
                        const search = /<a?:.+?:(\d+?)>/g;
                        const text = msg.content;
                        let match: RegExpExecArray | null;

                        while ((match = search.exec(text))) {
                            const emoteID = match[1];

                            if (emoteID in stats) {
                                if (msg.author.bot) stats[emoteID].bots++;
                                else {
                                    stats[emoteID].users++;
                                    totalUserEmoteUsage++;
                                }
                            }
                        }

                        for (const reaction of msg.reactions.cache.values()) {
                            const emoteID = reaction.emoji.id;
                            let continueReactionLoop = true;
                            let lastUserID: string | undefined;
                            let userReactions = 0;
                            let botReactions = 0;

                            // An emote's ID will be null if it's a unicode emote.
                            if (emoteID && emoteID in stats) {
                                // There is a simple count property on a reaction, but that doesn't separate users from bots.
                                // So instead, I'll use that property to check for inconsistencies.
                                while (continueReactionLoop) {
                                    // After logging users, it seems like the order is strictly numerical. As long as that stays consistent, this should work fine.
                                    const users = await reaction.users.fetch({
                                        limit: 100,
                                        after: lastUserID
                                    });

                                    if (users.size > 0) {
                                        for (const user of users.values()) {
                                            if (user.bot) {
                                                stats[emoteID].bots++;
                                                botReactions++;
                                            } else {
                                                stats[emoteID].users++;
                                                totalUserEmoteUsage++;
                                                userReactions++;
                                            }

                                            lastUserID = user.id;
                                        }
                                    } else {
                                        // Then halt the loop and send warnings of any inconsistencies.
                                        continueReactionLoop = false;

                                        if (reaction.count !== userReactions + botReactions) {
                                            console.warn(
                                                `[Channel: ${channel.id}, Message: ${msg.id}] A reaction count of ${reaction.count} was expected but was given ${userReactions} user reactions and ${botReactions} bot reactions.`
                                            );
                                            warnings++;
                                        }
                                    }
                                }
                            }
                        }

                        selected = msg.id;
                        messagesSearched++;
                    }
                } else {
                    continueLoop = false;
                    channelsSearched++;
                }
            }
        }

        // Mark the operation as ended.
        const finishTime = Date.now();
        clearInterval(interval);
        statusMessage.edit(
            `Finished operation in ${moment.duration(finishTime - startTime).humanize()} with ${pluralise(
                warnings,
                "inconsistenc",
                "ies",
                "y"
            )}.`
        );
        console.log(`Finished operation in ${finishTime - startTime} ms.`);
        channel.stopTyping();

        // Display stats on emote usage.
        // This can work outside the loop now that it's synchronous, and now it's clearer what code is meant to execute at the end.
        let sortedEmoteIDs = Object.keys(stats).sort((a, b) => stats[b].users - stats[a].users);
        const lines: string[] = [];
        let rank = 1;

        // It's better to send all the lines at once rather than paginate the data because it's quite a memory-intensive task to search all the messages in a server for it, and I wouldn't want to activate the command again just to get to another page.
        for (const emoteID of sortedEmoteIDs) {
            const emote = stats[emoteID];
            const botInfo = emote.bots > 0 ? ` (Bots: ${emote.bots})` : "";
            lines.push(
                `\`#${rank++}\` ${emote.formatted} x ${emote.users} - ${(
                    (emote.users / totalUserEmoteUsage) * 100 || 0
                ).toFixed(3)}%` + botInfo
            );
        }

        return await send(lines, {split: true});
    },
    subcommands: {
        forcereset: new NamedCommand({
            description: "Forces the cooldown timer to reset.",
            permission: PERMISSIONS.BOT_SUPPORT,
            async run({send, guild}) {
                lastUsedTimestamps.set(guild!.id, 0);
                send("Reset the cooldown on `scanemotes`.");
            }
        })
    }
});
