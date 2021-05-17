import {client} from "../index";
import {Storage} from "../structures";
import {Permissions} from "discord.js";

client.on("voiceStateUpdate", async (before, after) => {
    const channel = before.channel;
    const {channelNames} = Storage.getGuild(after.guild.id);

    if (
        channel &&
        channel.members.size === 0 &&
        channel.id in channelNames &&
        before.guild.me?.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)
    ) {
        channel.setName(channelNames[channel.id]);
    }
});
