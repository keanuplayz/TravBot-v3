import Event from "../core/event";
import {updateGlobalEmoteRegistry} from "../core/libd";

export default new Event<"guildCreate">({
    on() {
        console.log("Updated emote registry.");
        updateGlobalEmoteRegistry();
    }
});
