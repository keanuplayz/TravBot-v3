import {NamedCommand, RestCommand} from "onion-lasers";
import {WolframClient} from "node-wolfram-alpha";
import {MessageEmbed} from "discord.js";

export default new NamedCommand({
    description: "Calculates a specified math expression.",
    run: "Please provide a calculation.",
    any: new RestCommand({
        async run({send, combined}) {
            if (!process.env.WOLFRAM_API_KEY) return send("There's no Wolfram API key in `.env`.");

            const wClient = new WolframClient(process.env.WOLFRAM_API_KEY);
            let resp;
            try {
                resp = await wClient.query(combined);
            } catch (e: any) {
                return send("Something went wrong.");
            }

            if (!resp.data.queryresult.pods) return send("No pods were returned. Your query was likely invalid.");
            else {
                // TODO: Please don't hardcode the pod to fetch, try to figure out
                // which is the right one based on some comparisons instead
                const embed = new MessageEmbed()
                    .setColor(0xffffff)
                    .setTitle("Math Calculation")
                    .addField("Input", `\`\`\`\n${combined}\`\`\``)
                    .addField("Output", `\`\`\`\n${resp.data.queryresult.pods[1].subpods[0].plaintext}\`\`\``);
                return send({embeds: [embed]});
            }
        }
    })
});
