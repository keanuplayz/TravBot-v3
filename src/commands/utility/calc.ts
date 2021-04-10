import {Command, NamedCommand} from "../../core";
import * as math from "mathjs";
import {MessageEmbed} from "discord.js";

export default new NamedCommand({
    description: "Calculates a specified math expression.",
    async run({send, message, channel, guild, author, member, client, args}) {
        if (!args[0]) return send("Please provide a calculation.");
        let resp;
        try {
            resp = math.evaluate(args.join(" "));
        } catch (e) {
            return send("Please provide a *valid* calculation.");
        }
        const embed = new MessageEmbed()
            .setColor(0xffffff)
            .setTitle("Math Calculation")
            .addField("Input", `\`\`\`js\n${args.join("")}\`\`\``)
            .addField("Output", `\`\`\`js\n${resp}\`\`\``);
        return send(embed);
    }
});
