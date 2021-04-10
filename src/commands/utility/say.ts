import {Command, NamedCommand} from "../../core";

export default new NamedCommand({
    description: "Repeats your message.",
    usage: "<message>",
    run: "Please provide a message for me to say!",
    any: new Command({
        description: "Message to repeat.",
        async run({send, message, channel, guild, author, member, client, args}) {
            send(`*${author} says:*\n${args.join(" ")}`);
        }
    })
});
