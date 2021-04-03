import Event from "../core/event";
import $ from "../core/lib";
import {updateGlobalEmoteRegistry} from "../core/lib";
import {client} from "../index";
import {Config} from "../core/structures";
import {TextChannel} from "discord.js";

export default new Event<"guildDelete">({
    on(guild) {
        $.log(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot. Updated emote registry.`);

        if (Config.systemLogsChannel) {
            const channel = client.channels.cache.get(Config.systemLogsChannel);

            if (channel && channel.type === "text") {
                (channel as TextChannel).send(`\`${guild.name}\` (\`${guild.id}\`) removed the bot.`);
            } else {
                console.warn(`${Config.systemLogsChannel} is not a valid text channel for system logs!`);
            }
        }

        updateGlobalEmoteRegistry();
    }
});
