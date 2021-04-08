import {client} from "../index";
import {GuildChannel, TextChannel} from "discord.js";
import {Config} from "../structures";

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

client.on("guildCreate", (guild) => {
    console.log(
        `[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${guild.owner!.user.tag} (${
            guild.owner!.user.id
        }).`
    );

    if (Config.systemLogsChannel) {
        const channel = client.channels.cache.get(Config.systemLogsChannel);

        if (channel && channel.type === "text") {
            (channel as TextChannel).send(
                `TravBot joined: \`${guild.name}\`. The owner of this guild is: \`${guild.owner!.user.tag}\` (\`${
                    guild.owner!.user.id
                }\`)`
            );
        } else {
            console.warn(`${Config.systemLogsChannel} is not a valid text channel for system logs!`);
        }
    }
});

client.on("guildDelete", (guild) => {
    console.log(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot.`);

    if (Config.systemLogsChannel) {
        const channel = client.channels.cache.get(Config.systemLogsChannel);

        if (channel && channel.type === "text") {
            (channel as TextChannel).send(`\`${guild.name}\` (\`${guild.id}\`) removed the bot.`);
        } else {
            console.warn(`${Config.systemLogsChannel} is not a valid text channel for system logs!`);
        }
    }
});
