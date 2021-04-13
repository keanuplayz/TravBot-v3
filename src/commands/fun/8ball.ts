import {NamedCommand, RestCommand} from "onion-lasers";
import {random} from "../../lib";

const responses = [
    "Most likely,",
    "It is certain,",
    "It is decidedly so,",
    "Without a doubt,",
    "Definitely,",
    "You may rely on it,",
    "As I see it, yes,",
    "Outlook good,",
    "Yes,",
    "Signs point to yes,",
    "Reply hazy, try again,",
    "Ask again later,",
    "Better not tell you now,",
    "Cannot predict now,",
    "Concentrate and ask again,",
    "Don't count on it,",
    "My reply is no,",
    "My sources say no,",
    "Outlook not so good,",
    "Very doubtful,"
];

export default new NamedCommand({
    description: "Answers your question in an 8-ball manner.",
    usage: "<question>",
    run: "Please provide a question.",
    any: new RestCommand({
        description: "Question to ask the 8-ball.",
        async run({send, author}) {
            send(`${random(responses)} ${author}`);
        }
    })
});
