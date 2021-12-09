import {client} from "../index";
import {Guild} from "../lib";
import {Permissions} from "discord.js";

client.on("voiceStateUpdate", async (before, after) => {
    const channel = before.channel;
    const guild = new Guild(after.guild.id);

    if (
        channel &&
        channel.members.size === 0 &&
        guild.hasDefaultChannelName(channel.id) &&
        before.guild.me?.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)
    ) {
        channel.setName(guild.getDefaultChannelName(channel.id)!);
    }
});
