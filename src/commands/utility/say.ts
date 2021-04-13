import {NamedCommand, RestCommand} from "onion-lasers";

export default new NamedCommand({
    description: "Repeats your message.",
    usage: "<message>",
    run: "Please provide a message for me to say!",
    any: new RestCommand({
        description: "Message to repeat.",
        async run({send, author, combined}) {
            send(`*${author} says:*\n${combined}`);
        }
    })
});
