import Event from "../core/event";
import {updateGlobalEmoteRegistry} from "../core/lib";

export default new Event<"emojiDelete">({
    on() {
        console.log("Updated emote registry.");
        updateGlobalEmoteRegistry();
    }
});
