import {client} from "../index";
import {createPath, EmoteRegistryDump} from "../lib";
import {writeFile} from "fs/promises";
import {join} from "path";

function updateGlobalEmoteRegistry(): void {
    const data: EmoteRegistryDump = {version: 1, list: []};

    for (const guild of client.guilds.cache.values()) {
        for (const emote of guild.emojis.cache.values()) {
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

    createPath("public"); // generate folder if it doesn't exist
    writeFile(join("public", "emote-registry.json"), JSON.stringify(data, null, "\t")).catch(console.error);
}

client.on("emojiCreate", updateGlobalEmoteRegistry);
client.on("emojiDelete", updateGlobalEmoteRegistry);
client.on("emojiUpdate", updateGlobalEmoteRegistry);
client.on("guildCreate", updateGlobalEmoteRegistry);
client.on("guildDelete", updateGlobalEmoteRegistry);
client.on("ready", updateGlobalEmoteRegistry);
