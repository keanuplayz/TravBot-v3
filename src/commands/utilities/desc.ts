import Command from "../../core/command";
import {CommonLibrary} from "../../core/lib";

export default new Command({
    description: "Renames current voice channel.",
    usage: "<name>",
    async run($: CommonLibrary): Promise<any> {
        const voiceChannel = $.message.member?.voice.channel;

        if (!voiceChannel) return $.channel.send("You are not in a voice channel.");

        if (!voiceChannel.guild.me?.hasPermission("MANAGE_CHANNELS"))
            return $.channel.send("I am lacking the required permissions to perform this action.");

        if ($.args.length === 0) return $.channel.send("Please provide a new voice channel name.");

        const prevName = voiceChannel.name;
        const newName = $.args.join(" ");
        await voiceChannel.setName(newName);
        await $.channel.send(`Changed channel name from "${prevName}" to "${newName}".`);
    }
});
