import Event from "../core/event";
import {client} from "../index";
import {Config} from "../core/structures";
import {updateGlobalEmoteRegistry} from "../core/lib";

export default new Event<"ready">({
    once() {
        if (client.user) {
            console.ready(`Logged in as ${client.user.username}#${client.user.discriminator}.`);
            client.user.setActivity({
                type: "LISTENING",
                name: `${Config.prefix}help`
            });
        }
        updateGlobalEmoteRegistry();
    }
});
