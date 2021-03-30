import Event from "../core/event";
import {updateGlobalEmoteRegistry} from "../core/libd";

export default new Event<"emojiCreate">({
    on(emote) {
        console.log(`Updated emote registry. ${emote.name}`);
        updateGlobalEmoteRegistry();
    }
});
