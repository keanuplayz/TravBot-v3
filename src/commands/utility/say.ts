import {Command, NamedCommand, RestCommand} from "../../core";

export default new NamedCommand({
    description: "Repeats your message.",
    usage: "<message>",
    run: "Please provide a message for me to say!",
    any: new RestCommand({
        description: "Message to repeat.",
        async run({send, message, channel, guild, author, member, client, args, combined}) {
            send(`*${author} says:*\n${combined}`);
        }
    })
});
