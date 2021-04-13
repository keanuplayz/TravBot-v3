import {MessageEmbed, Message, User} from "discord.js";
import {NamedCommand, RestCommand, poll, CHANNEL_TYPE, SendFunction, Command} from "onion-lasers";
import {pluralise} from "../../lib";

export default new NamedCommand({
    description: "Create a poll.",
    usage: "(<seconds>) <question>",
    run: "Please provide a question.",
    channelType: CHANNEL_TYPE.GUILD,
    number: new Command({
        run: "Please provide a question in addition to the provided duration.",
        any: new RestCommand({
            description: "Question for the poll.",
            async run({send, message, author, args, combined}) {
                execPoll(send, message, author, combined, args[0]);
            }
        })
    }),
    any: new RestCommand({
        description: "Question for the poll.",
        async run({send, message, author, combined}) {
            execPoll(send, message, author, combined);
        }
    })
});

const AGREE = "✅";
const DISAGREE = "⛔";

async function execPoll(send: SendFunction, message: Message, user: User, question: string, duration = 60000) {
    const icon =
        user.avatarURL({
            dynamic: true,
            size: 2048
        }) || user.defaultAvatarURL;
    const msg = await send(
        new MessageEmbed()
            .setAuthor(`Poll created by ${message.author.username}`, icon)
            .setColor(0xffffff)
            .setFooter("React to vote.")
            .setDescription(question)
    );
    const results = await poll(msg, [AGREE, DISAGREE], duration);
    send(
        new MessageEmbed()
            .setAuthor(`The results of ${message.author.username}'s poll:`, icon)
            .setTitle(question)
            .setDescription(
                `${AGREE} － ${pluralise(
                    results[AGREE],
                    "",
                    "people who agree",
                    "person who agrees"
                )}\n${DISAGREE} － ${pluralise(results[DISAGREE], "", "people who disagree", "person who disagrees")}`
            )
    );
    msg.delete();
}
