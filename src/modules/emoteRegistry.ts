import {client} from "../index";
import FileManager from "./storage";
import {EmoteRegistryDump} from "../structures";

async function updateGlobalEmoteRegistry(): Promise<void> {
    const data: EmoteRegistryDump = {version: 1, list: []};

    for (const guild of client.guilds.cache.values()) {
        let g = await guild.fetch();
        for (const emote of g.emojis.cache.values()) {
            data.list.push({
                ref: emote.name,
                id: emote.id,
                name: emote.name,
                requires_colons: emote.requiresColons ?? false,
                animated: emote.animated ?? false,
                url: emote.url,
                guild_id: emote.guild.name,
                guild_name: emote.guild.name
            });
        }
    }

    FileManager.open("data/public"); // generate folder if it doesn't exist
    FileManager.write("public/emote-registry", data, false);
}

client.on("emojiCreate", updateGlobalEmoteRegistry);
client.on("emojiDelete", updateGlobalEmoteRegistry);
client.on("emojiUpdate", updateGlobalEmoteRegistry);
client.on("guildCreate", updateGlobalEmoteRegistry);
client.on("guildDelete", updateGlobalEmoteRegistry);
client.on("ready", updateGlobalEmoteRegistry);
