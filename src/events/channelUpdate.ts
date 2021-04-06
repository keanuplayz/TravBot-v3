import Event from "../core/event";
import {streamList} from "./voiceStateUpdate";

export default new Event<"channelUpdate">({
    async on(before, after) {
        if (before.type === "voice" && after.type === "voice") {
            for (const stream of streamList.values()) {
                if (after.id === stream.channel.id) {
                    stream.update();
                }
            }
        }
    }
});
