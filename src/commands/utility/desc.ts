import {NamedCommand, RestCommand} from "onion-lasers";

export default new NamedCommand({
    description: "Renames current voice channel.",
    usage: "<name>",
    run: "Please provide a new voice channel name.",
    any: new RestCommand({
        async run({send, message, combined}) {
            const voiceChannel = message.member?.voice.channel;

            if (!voiceChannel) return send("You are not in a voice channel.");
            if (!voiceChannel.guild.me?.hasPermission("MANAGE_CHANNELS"))
                return send("I am lacking the required permissions to perform this action.");

            const prevName = voiceChannel.name;
            const newName = combined;
            await voiceChannel.setName(newName);
            return await send(`Changed channel name from "${prevName}" to "${newName}".`);
        }
    })
});
