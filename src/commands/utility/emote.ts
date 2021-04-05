import {Command, NamedCommand} from "../../core";
import {queryClosestEmoteByName} from "./modules/emote-utils";

export default new NamedCommand({
    description: "Send the specified emote.",
    run: "Please provide a command name.",
    any: new Command({
        description: "The emote(s) to send.",
        usage: "<emotes...>",
        async run({guild, channel, message, args}) {
            let output = "";
            for (const query of args) output += queryClosestEmoteByName(query).toString();
            channel.send(output);
        }
    })
});
