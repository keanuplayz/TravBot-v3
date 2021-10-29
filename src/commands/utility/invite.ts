import {Command, NamedCommand} from "onion-lasers";

export default new NamedCommand({
    description: "Gives you the invite link.",
    async run({send, client}) {
        send(
            `https://discordapp.com/api/oauth2/authorize?client_id=${
                client.user!.id
            }&permissions=138046467152&scope=bot`
        );
    },
    number: new Command({
        async run({send, client, args}) {
            send(
                `https://discordapp.com/api/oauth2/authorize?client_id=${client.user!.id}&permissions=${
                    args[0]
                }&scope=bot`
            );
        }
    })
});
