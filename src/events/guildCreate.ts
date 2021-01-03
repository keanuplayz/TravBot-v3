import Event from "../core/event";
import $ from "../core/lib";
import {updateGlobalEmoteRegistry} from "../core/lib";

export default new Event<"guildCreate">({
    on() {
        $.log("Updated emote registry.");
        updateGlobalEmoteRegistry();
    }
});
