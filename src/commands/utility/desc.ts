import {Command, NamedCommand} from "../../core";

export default new NamedCommand({
    description: "Renames current voice channel.",
    usage: "<name>",
    async run({send, message, channel, guild, author, member, client, args}) {
        const voiceChannel = message.member?.voice.channel;

        if (!voiceChannel) return send("You are not in a voice channel.");
        if (!voiceChannel.guild.me?.hasPermission("MANAGE_CHANNELS"))
            return send("I am lacking the required permissions to perform this action.");
        if (args.length === 0) return send("Please provide a new voice channel name.");

        const prevName = voiceChannel.name;
        const newName = args.join(" ");
        await voiceChannel.setName(newName);
        return await send(`Changed channel name from "${prevName}" to "${newName}".`);
    }
});
