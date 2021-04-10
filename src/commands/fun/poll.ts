import {MessageEmbed} from "discord.js";
import {Command, NamedCommand} from "../../core";

export default new NamedCommand({
    description: "Create a poll.",
    usage: "<question>",
    run: "Please provide a question.",
    any: new Command({
        description: "Question for the poll.",
        async run({send, message, channel, guild, author, member, client, args}) {
            const embed = new MessageEmbed()
                .setAuthor(
                    `Poll created by ${message.author.username}`,
                    message.guild?.iconURL({dynamic: true}) ?? undefined
                )
                .setColor(0xffffff)
                .setFooter("React to vote.")
                .setDescription(args.join(" "));
            const msg = await send(embed);
            await msg.react("✅");
            await msg.react("⛔");
            message.delete({
                timeout: 1000
            });
        }
    })
});
