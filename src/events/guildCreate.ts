import Event from "../core/event";
import $ from "../core/lib";
import {updateGlobalEmoteRegistry} from "../core/lib";

export default new Event<"guildCreate">({
    on(guild) {
        $.log(
            `[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${guild.owner!.user.tag} (${
                guild.owner!.user.id
            }). Updated emote registry.`
        );
        updateGlobalEmoteRegistry();
    }
});
