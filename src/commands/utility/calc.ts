import {NamedCommand, RestCommand} from "onion-lasers";
import * as math from "mathjs";
import {MessageEmbed} from "discord.js";

export default new NamedCommand({
    description: "Calculates a specified math expression.",
    run: "Please provide a calculation.",
    any: new RestCommand({
        async run({send, combined}) {
            let resp;
            try {
                resp = math.evaluate(combined);
            } catch (e) {
                return send("Please provide a *valid* calculation.");
            }
            const embed = new MessageEmbed()
                .setColor(0xffffff)
                .setTitle("Math Calculation")
                .addField("Input", `\`\`\`js\n${combined}\`\`\``)
                .addField("Output", `\`\`\`js\n${resp}\`\`\``);
            return send(embed);
        }
    })
});
