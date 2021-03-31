import {client} from "../index";
import FileManager from "../core/storage";
import {EmoteRegistryDump} from "../core/structures";

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

client.on("guildCreate", () => {
    console.log("Updated emote registry.");
    updateGlobalEmoteRegistry();
});

client.on("guildDelete", () => {
    console.log("Updated emote registry.");
    updateGlobalEmoteRegistry();
});

client.on("ready", () => {
    updateGlobalEmoteRegistry();
});
