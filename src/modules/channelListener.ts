import {client} from "../index";
import {GuildChannel} from "discord.js";

client.on("channelCreate", async (channel) => {
    const botGuilds = client.guilds;

    if (channel instanceof GuildChannel) {
        const createdGuild = await botGuilds.fetch(channel.guild.id);
        console.log(`Channel created in '${createdGuild.name}' called '#${channel.name}'`);
    }
});

client.on("channelDelete", async (channel) => {
    const botGuilds = client.guilds;

    if (channel instanceof GuildChannel) {
        const createdGuild = await botGuilds.fetch(channel.guild.id);
        console.log(`Channel deleted in '${createdGuild.name}' called '#${channel.name}'`);
    }
});
