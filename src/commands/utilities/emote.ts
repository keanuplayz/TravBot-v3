import Command from "../../core/command";
import {processEmoteQueryFormatted} from "./subcommands/emote-utils";
import {botHasPermission} from "../../core/lib";
import {Permissions} from "discord.js";

export default new Command({
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
