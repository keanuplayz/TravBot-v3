import {Command, NamedCommand} from "../../core";

export default new NamedCommand({
    description: "Renames current voice channel.",
    usage: "<name>",
    async run({message, channel, guild, author, member, client, args}) {
        const voiceChannel = message.member?.voice.channel;

        if (!voiceChannel) {
            channel.send("You are not in a voice channel.");
            return;
        }

        if (!voiceChannel.guild.me?.hasPermission("MANAGE_CHANNELS")) {
            channel.send("I am lacking the required permissions to perform this action.");
            return;
        }

        if (args.length === 0) {
            channel.send("Please provide a new voice channel name.");
            return;
        }

        const prevName = voiceChannel.name;
        const newName = args.join(" ");
        await voiceChannel.setName(newName);
        await channel.send(`Changed channel name from "${prevName}" to "${newName}".`);
    }
});
