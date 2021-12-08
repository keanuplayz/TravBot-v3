import {client} from "../index";
import {Storage, getPrefix} from "../structures";

client.once("ready", () => {
    if (client.user) {
        console.ready(
            `Logged in as ${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers.`
        );
        client.user.setActivity({
            type: "LISTENING",
            name: `${getPrefix()}help`
        });

        // Run this setup block once to restore eco bet money in case the bot went down. (And I guess search the client for those users to let them know too.)
        for (const id in Storage.users) {
            const user = Storage.users[id];

            if (user.ecoBetInsurance > 0) {
                client.users.cache
                    .get(id)
                    ?.send(
                        `Because my system either crashed or restarted while you had a pending bet, the total amount of money that you bet, which was \`${user.ecoBetInsurance}\`, has been restored.`
                    );
                user.money += user.ecoBetInsurance;
                user.ecoBetInsurance = 0;
            }
        }
        Storage.save();
    }
});
