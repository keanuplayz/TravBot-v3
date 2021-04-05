import Command from "../../core/command";

export default new Command({
    description: "Chooses someone to love.",
    async run($) {
        if ($.guild) {
            const member = $.guild.members.cache.random();
            $.channel.send(`I love ${member.user.username}!`);
        } else {
            $.channel.send("You must use this command in a guild!");
        }
    }
});
