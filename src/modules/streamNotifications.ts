import {GuildMember, VoiceChannel, MessageEmbed, TextChannel, Message, Collection} from "discord.js";
import {client} from "../index";
import {Storage} from "../structures";

type Stream = {
    streamer: GuildMember;
    channel: VoiceChannel;
    category: string;
    description?: string;
    thumbnail?: string;
    message: Message;
    streamStart: number;
    update: () => void;
};

// A list of user IDs and message embeds.
export const streamList = new Collection<string, Stream>();

// Probably find a better, DRY way of doing this.
function getStreamEmbed(
    streamer: GuildMember,
    channel: VoiceChannel,
    streamStart: number,
    category: string,
    description?: string,
    thumbnail?: string
): MessageEmbed {
    const user = streamer.user;
    const embed = new MessageEmbed()
        .setTitle(channel.name)
        .setAuthor(
            streamer.nickname ?? user.username,
            user.avatarURL({
                dynamic: true,
                format: "png"
            }) ?? user.defaultAvatarURL
        )
        // I decided to not include certain fields:
        // .addField("Activity", "CrossCode", true) - Probably too much presence data involved, increasing memory usage.
        // .addField("Viewers", 5, true) - There doesn't seem to currently be a way to track how many viewers there are. Presence data for "WATCHING" doesn't seem to affect it, and listening to raw client events doesn't seem to make it appear either.
        .addField("Voice Channel", channel, true)
        .addField("Category", category, true)
        .setColor(streamer.displayColor)
        .setFooter(
            "Stream Started",
            streamer.guild.iconURL({
                dynamic: true
            }) || undefined
        )
        .setTimestamp(streamStart);

    if (description) embed.setDescription(description);
    if (thumbnail) embed.setThumbnail(thumbnail);

    return embed;
}

client.on("voiceStateUpdate", async (before, after) => {
    const isStartStreamEvent = !before.streaming && after.streaming;
    const isStopStreamEvent = before.streaming && (!after.streaming || !after.channel); // If you were streaming before but now are either not streaming or have left the channel.
    // Note: isStopStreamEvent can be called twice in a row - If Discord crashes/quits while you're streaming, it'll call once with a null channel and a second time with a channel.

    if (isStartStreamEvent || isStopStreamEvent) {
        const {streamingChannel, streamingRoles, members} = Storage.getGuild(after.guild.id);

        if (streamingChannel) {
            const member = after.member!;
            const voiceChannel = after.channel!;
            const textChannel = client.channels.cache.get(streamingChannel);

            // Although checking the bot's permission to send might seem like a good idea, having the error be thrown will cause it to show up in the last channel rather than just show up in the console.
            if (textChannel instanceof TextChannel) {
                if (isStartStreamEvent) {
                    const streamStart = Date.now();
                    let streamNotificationPing = "";
                    let category = "None";

                    // Check the category if there's one set then ping that role.
                    if (member.id in members) {
                        const roleID = members[member.id].streamCategory;

                        // Only continue if they set a valid category.
                        if (roleID && roleID in streamingRoles) {
                            streamNotificationPing = `<@&${roleID}>`;
                            category = streamingRoles[roleID];
                        }
                    }

                    streamList.set(member.id, {
                        streamer: member,
                        channel: voiceChannel,
                        category,
                        message: await textChannel.send(
                            streamNotificationPing,
                            getStreamEmbed(member, voiceChannel, streamStart, category)
                        ),
                        update(this: Stream) {
                            this.message.edit(
                                getStreamEmbed(
                                    this.streamer,
                                    this.channel,
                                    streamStart,
                                    this.category,
                                    this.description,
                                    this.thumbnail
                                )
                            );
                        },
                        streamStart
                    });
                } else if (isStopStreamEvent) {
                    if (streamList.has(member.id)) {
                        const {message} = streamList.get(member.id)!;
                        message.delete();
                        streamList.delete(member.id);
                    }
                }
            } else {
                console.error(
                    `The streaming notifications channel ${streamingChannel} for guild ${after.guild.id} either doesn't exist or isn't a text channel.`
                );
            }
        }
    }
});

client.on("channelUpdate", (before, after) => {
    if (before.type === "voice" && after.type === "voice") {
        for (const stream of streamList.values()) {
            if (after.id === stream.channel.id) {
                stream.update();
            }
        }
    }
});
