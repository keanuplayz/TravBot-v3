import {Command, NamedCommand, CHANNEL_TYPE} from "../../core";

export default new NamedCommand({
    description: "Chooses someone to love.",
    channelType: CHANNEL_TYPE.GUILD,
    async run({message, channel, guild, author, client, args}) {
        const member = guild!.members.cache.random();
        channel.send(`I love ${member.nickname ?? member.user.username}!`);
    }
});
