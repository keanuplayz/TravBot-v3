import Command from "../../core/command";
import * as math from "mathjs";
import {MessageEmbed} from "discord.js";

export default new Command({
    description: "Calculates a specified math expression.",
    async run($) {
        if (!$.args[0]) {
            $.channel.send("Please provide a calculation.");
            return;
        }
        let resp;
        try {
            resp = math.evaluate($.args.join(" "));
        } catch (e) {
            $.channel.send("Please provide a *valid* calculation.");
            return;
        }
        const embed = new MessageEmbed()
            .setColor(0xffffff)
            .setTitle("Math Calculation")
            .addField("Input", `\`\`\`js\n${$.args.join("")}\`\`\``)
            .addField("Output", `\`\`\`js\n${resp}\`\`\``);
        $.channel.send(embed);
    }
});
