import {MessageEmbed} from "discord.js";
import Command from "../../core/command";
import {CommonLibrary} from "../../core/lib";

export default new Command({
    description: "Send the specified emote.",
    run: "Please provide a command name.",
    any: new Command({
        description: "The emote to send.",
        usage: "<emote>",
        async run($: CommonLibrary): Promise<any> {
            const search = $.args[0].toLowerCase();
            const emote = $.client.emojis.cache.find((emote) =>
                emote.name.toLowerCase().includes(search)
            );
            if (!emote) return $.channel.send("That's not a valid emote name!");
            $.message.delete();
            $.channel.send(`${emote}`);
        }
    })
});
