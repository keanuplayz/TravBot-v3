import {CHANNEL_TYPE, Command, NamedCommand} from "onion-lasers";
import {registerWebhook, deleteWebhook} from "../../modules/webhookStorageManager";

// Because adding webhooks involves sending tokens, you'll want to prevent this from being used in non-private contexts.
export default new NamedCommand({
    channelType: CHANNEL_TYPE.DM,
    description: "Manage webhooks stored by the bot.",
    usage: "register/delete <webhook URL>",
    run: "You need to use `register`/`delete`.",
    subcommands: {
        register: new NamedCommand({
            description: "Adds a webhook to the bot's storage.",
            any: new Command({
                async run({send, args}) {
                    if (registerWebhook(args[0])) {
                        send("Registered webhook with bot.");
                    } else {
                        send("Invalid webhook URL.");
                    }
                }
            })
        }),
        delete: new NamedCommand({
            description: "Removes a webhook from the bot's storage.",
            any: new Command({
                async run({send, args}) {
                    if (deleteWebhook(args[0])) {
                        send("Deleted webhook.");
                    } else send("Invalid webhook URL/ID.");
                }
            })
        })
    }
});
