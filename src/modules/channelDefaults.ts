import {client} from "../index";
import {Storage} from "../structures";

client.on("voiceStateUpdate", async (before, after) => {
    const channel = before.channel!;
    const {channelNames} = Storage.getGuild(after.guild.id);

    if (channel?.members.size === 0 && channel?.id in channelNames) {
        channel.setName(channelNames[channel.id]);
    }
});
