import Command from "../../core/command";

export default new Command({
    description: "Gives you the invite link.",
    async run($) {
        $.channel.send(
            `https://discordapp.com/api/oauth2/authorize?client_id=${$.client.user!.id}&permissions=${
                $.args[0] || 8
            }&scope=bot`
        );
    }
});
