import {Command, NamedCommand} from "../../core";
import {MessageEmbed} from "discord.js";
// Anycasting Alert
const urban = require("relevant-urban");

export default new NamedCommand({
    description: "Gives you a definition of the inputted word.",
    async run({message, channel, guild, author, member, client, args}) {
        if (!args[0]) {
            channel.send("Please input a word.");
        }
        const res = await urban(args.join(" ")).catch((e: Error) => {
            return channel.send("Sorry, that word was not found.");
        });
        const embed = new MessageEmbed()
            .setColor(0x1d2439)
            .setTitle(res.word)
            .setURL(res.urbanURL)
            .setDescription(`**Definition:**\n*${res.definition}*\n\n**Example:**\n*${res.example}*`)
            .addField("Author", res.author, true)
            .addField("Rating", `**\`Upvotes: ${res.thumbsUp} | Downvotes: ${res.thumbsDown}\`**`);
        if (res.tags.length > 0 && res.tags.join(" ").length < 1024) {
            embed.addField("Tags", res.tags.join(", "), true);
        }
        channel.send(embed);
    }
});
