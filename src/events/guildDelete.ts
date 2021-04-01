import Event from "../core/event";
import $ from "../core/lib";
import {updateGlobalEmoteRegistry} from "../core/lib";

export default new Event<"guildDelete">({
    on(guild) {
        $.log(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot. Updated emote registry.`);
        updateGlobalEmoteRegistry();
    }
});
