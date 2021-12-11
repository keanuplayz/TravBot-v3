import {NamedCommand, RestCommand} from "onion-lasers";
import figlet from "figlet";
import {Util} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";

export const header = new SlashCommandBuilder()
    .setDescription("Generates a figlet of your input.")
    .addStringOption((option) =>
        option.setName("text").setDescription("Text used to create the figlet.").setRequired(true)
    );
export async function handler(interaction: CommandInteraction) {
    const {options} = interaction;
    return interaction.reply(
        `\`\`\`\n${Util.cleanCodeBlockContent(
            figlet.textSync(options.getString("text", true), {
                horizontalLayout: "full"
            })
        )}\n\`\`\``
    );
}
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
