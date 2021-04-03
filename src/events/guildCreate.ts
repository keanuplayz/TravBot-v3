import Event from "../core/event";
import $ from "../core/lib";
import {updateGlobalEmoteRegistry} from "../core/lib";
import {client} from "../index";
import {Config} from "../core/structures";
import {TextChannel} from "discord.js";

export default new Event<"guildCreate">({
    on(guild) {
        $.log(
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
    }
});
