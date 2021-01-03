import Event from "../core/event";
import $ from "../core/lib";
import {updateGlobalEmoteRegistry} from "../core/lib";

export default new Event<"emojiCreate">({
    on(emote) {
        $.log(`Updated emote registry. ${emote.name}`);
        updateGlobalEmoteRegistry();
    }
});
