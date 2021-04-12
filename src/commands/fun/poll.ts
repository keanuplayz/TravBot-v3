import {MessageEmbed} from "discord.js";
import {NamedCommand, RestCommand} from "../../core";

export default new NamedCommand({
    description: "Create a poll.",
    usage: "<question>",
    run: "Please provide a question.",
    any: new RestCommand({
        description: "Question for the poll.",
        async run({send, message, combined}) {
            const embed = new MessageEmbed()
                .setAuthor(
                    `Poll created by ${message.author.username}`,
                    message.guild?.iconURL({dynamic: true}) ?? undefined
                )
                .setColor(0xffffff)
                .setFooter("React to vote.")
                .setDescription(combined);
            const msg = await send(embed);
            await msg.react("✅");
            await msg.react("⛔");
            message.delete({
                timeout: 1000
            });
        }
    })
});
