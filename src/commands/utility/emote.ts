import {Command, NamedCommand} from "../../core";
import {processEmoteQueryFormatted} from "./modules/emote-utils";

export default new NamedCommand({
    description:
        "Send the specified emote list. Enter + to move an emote list to the next line, - to add a space, and _ to add a zero-width space.",
    run: "Please provide a list of emotes.",
    any: new Command({
        description: "The emote(s) to send.",
        usage: "<emotes...>",
        async run({guild, channel, message, args}) {
            const output = processEmoteQueryFormatted(args);
            if (output.length > 0) channel.send(output);
        }
    })
});
