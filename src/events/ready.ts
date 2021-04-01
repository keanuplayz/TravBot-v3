import Event from "../core/event";
import {client} from "../index";
import $ from "../core/lib";
import {Config} from "../core/structures";
import {updateGlobalEmoteRegistry} from "../core/lib";

export default new Event<"ready">({
    once() {
        if (client.user) {
            $.ready(
                `Logged in as ${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers..`
            );
            client.user.setActivity({
                type: "LISTENING",
                name: `${Config.prefix}help`
            });
        }
        updateGlobalEmoteRegistry();
    }
});
