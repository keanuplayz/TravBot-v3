import {client} from "../index";
import {TextChannel} from "discord.js";
import {Config} from "../structures";

// Logging which guilds the bot is added to and removed from makes sense.
// However, logging the specific channels that are added/removed is a tad bit privacy-invading.

client.on("guildCreate", async (guild) => {
    const owner = await guild.fetchOwner();

    console.log(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${owner.user.tag} (${owner.user.id}).`);

    if (Config.systemLogsChannel) {
        const channel = client.channels.cache.get(Config.systemLogsChannel);

        if (channel && channel.type === "text") {
            (channel as TextChannel).send(
                `TravBot joined: \`${guild.name}\`. The owner of this guild is: \`${owner.user.tag}\` (\`${owner.user.id}\`)`
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
            console.warn(
                `${Config.systemLogsChannel} is not a valid text channel for system logs! Removing it from storage.`
            );
            Config.systemLogsChannel = null;
            Config.save();
        }
    }
});
