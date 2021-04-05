import {client} from "../index";
import FileManager from "./storage";
import {EmoteRegistryDump, Config} from "../structures";
import {TextChannel} from "discord.js";

function updateGlobalEmoteRegistry(): void {
    const data: EmoteRegistryDump = {version: 1, list: []};

    for (const guild of client.guilds.cache.values()) {
        for (const emote of guild.emojis.cache.values()) {
            data.list.push({
                ref: emote.name,
                id: emote.id,
                name: emote.name,
                requires_colons: emote.requiresColons || false,
                animated: emote.animated,
                url: emote.url,
                guild_id: emote.guild.name,
                guild_name: emote.guild.name
            });
        }
    }

    FileManager.write("emote-registry", data, true);
}

client.on("emojiCreate", (emote) => {
    console.log(`Updated emote registry. ${emote.name}`);
    updateGlobalEmoteRegistry();
});

client.on("emojiDelete", () => {
    console.log("Updated emote registry.");
    updateGlobalEmoteRegistry();
});

client.on("emojiUpdate", () => {
    console.log("Updated emote registry.");
    updateGlobalEmoteRegistry();
});

client.on("guildCreate", (guild) => {
    console.log(
        `[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${guild.owner!.user.tag} (${
            guild.owner!.user.id
        }). Updated emote registry.`
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

    updateGlobalEmoteRegistry();
});

client.on("guildDelete", (guild) => {
    console.log(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot. Updated emote registry.`);

    if (Config.systemLogsChannel) {
        const channel = client.channels.cache.get(Config.systemLogsChannel);

        if (channel && channel.type === "text") {
            (channel as TextChannel).send(`\`${guild.name}\` (\`${guild.id}\`) removed the bot.`);
        } else {
            console.warn(`${Config.systemLogsChannel} is not a valid text channel for system logs!`);
        }
    }

    updateGlobalEmoteRegistry();
});

client.on("ready", () => {
    updateGlobalEmoteRegistry();
});
