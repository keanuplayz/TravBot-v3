import {NamedCommand, RestCommand} from "onion-lasers";
import figlet from "figlet";
import {Util} from "discord.js";

export default new NamedCommand({
    description: "Generates a figlet of your input.",
    run: "You have to provide input for me to create a figlet!",
    any: new RestCommand({
        async run({send, combined}) {
            return send(
                `\`\`\`\n${Util.cleanCodeBlockContent(
                    figlet.textSync(combined, {
                        horizontalLayout: "full"
                    })
                )}\n\`\`\``
            );
        }
    })
});
