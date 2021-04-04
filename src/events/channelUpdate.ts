import Event from "../core/event";
import {streamList, getStreamEmbed} from "./voiceStateUpdate";

export default new Event<"channelUpdate">({
    async on(before, after) {
        if (before.type === "voice" && after.type === "voice") {
            for (const {streamer, channel, description, message} of streamList.values()) {
                if (after.id === channel.id) {
                    message.edit(getStreamEmbed(streamer, channel, description));
                }
            }
        }
    }
});
