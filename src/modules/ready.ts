import {client} from "../index";
import {Config} from "../structures";

client.once("ready", () => {
    if (client.user) {
        console.ready(
            `Logged in as ${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers..`
        );
        client.user.setActivity({
            type: "LISTENING",
            name: `${Config.prefix}help`
        });
    }
});
