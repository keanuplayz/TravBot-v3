import {GuildMember, VoiceChannel, MessageEmbed, TextChannel, Permissions, Message, Collection} from "discord.js";
import {client} from "../index";
import {Storage} from "../structures";

type Stream = {
    streamer: GuildMember;
    channel: VoiceChannel;
    description?: string;
    message: Message;
    update: () => void;
};

// A list of user IDs and message embeds.
export const streamList = new Collection<string, Stream>();

// Probably find a better, DRY way of doing this.
function getStreamEmbed(streamer: GuildMember, channel: VoiceChannel, description?: string): MessageEmbed {
    const user = streamer.user;
    const embed = new MessageEmbed()
        .setTitle(`Stream: \`#${channel.name}\``)
        .setAuthor(
            streamer.nickname ?? user.username,
            user.avatarURL({
                dynamic: true,
                format: "png"
            }) ?? user.defaultAvatarURL
        )
        .setColor(streamer.displayColor);

    if (description) {
        embed.setDescription(description);
    }

    return embed;
}

client.on("voiceStateUpdate", async (before, after) => {
    const isStartStreamEvent = !before.streaming && after.streaming;
    const isStopStreamEvent = before.streaming && (!after.streaming || !after.channel); // If you were streaming before but now are either not streaming or have left the channel.
    // Note: isStopStreamEvent can be called twice in a row - If Discord crashes/quits while you're streaming, it'll call once with a null channel and a second time with a channel.

    if (isStartStreamEvent || isStopStreamEvent) {
        const {streamingChannel} = Storage.getGuild(after.guild.id);

        if (streamingChannel) {
            const member = after.member!;
            const voiceChannel = after.channel!;
            const textChannel = client.channels.cache.get(streamingChannel);

            // Although checking the bot's permission to send might seem like a good idea, having the error be thrown will cause it to show up in the last channel rather than just show up in the console.
            if (textChannel instanceof TextChannel) {
                if (isStartStreamEvent) {
                    streamList.set(member.id, {
                        streamer: member,
                        channel: voiceChannel,
                        message: await textChannel.send(getStreamEmbed(member, voiceChannel)),
                        update(this: Stream) {
                            this.message.edit(getStreamEmbed(this.streamer, this.channel, this.description));
                        }
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
