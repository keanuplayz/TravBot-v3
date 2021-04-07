import {Command, NamedCommand} from "../../core";
import {processEmoteQueryFormatted} from "./modules/emote-utils";

export default new NamedCommand({
    description: "Send the specified emote.",
    run: "Please provide a command name.",
    any: new Command({
        description: "The emote(s) to send.",
        usage: "<emotes...>",
        async run({guild, channel, message, args}) {
            const output = processEmoteQueryFormatted(args);
            if (output.length > 0) channel.send(output);
        }
    })
});
