import {Command, NamedCommand} from "../../core";

export default new NamedCommand({
    description: "Chooses someone to love.",
    async run({message, channel, guild, author, member, client, args}) {
        if (guild) {
            const member = guild.members.cache.random();
            channel.send(`I love ${member.user.username}!`);
        } else {
            channel.send("You must use this command in a guild!");
        }
    }
});
