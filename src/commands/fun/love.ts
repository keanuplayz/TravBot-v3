import {NamedCommand, CHANNEL_TYPE} from "onion-lasers";

export default new NamedCommand({
    description: "Chooses someone to love.",
    channelType: CHANNEL_TYPE.GUILD,
    async run({send, guild}) {
        const member = guild!.members.cache.random();
        if (!member) return send("For some reason, an error occurred fetching a member.");
        return send(`I love ${member.nickname ?? member.user.username}!`);
    }
});
