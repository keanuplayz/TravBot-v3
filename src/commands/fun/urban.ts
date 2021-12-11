import {SlashCommandBuilder} from "@discordjs/builders";
import {NamedCommand, RestCommand} from "onion-lasers";
import {MessageEmbed, CommandInteraction} from "discord.js";
import urban from "relevant-urban";

export const header = new SlashCommandBuilder()
    .setDescription("Gives you a definition of the inputted word.")
    .addStringOption((option) =>
        option.setName("word").setDescription("The word you're looking for").setRequired(true)
    );

export async function handler(interaction: CommandInteraction) {
    const {options} = interaction;
    await interaction.reply("Working on it....");
    const response = options.getString("word", true);
    // [Bug Fix]: Use encodeURIComponent() when emojis are used: "TypeError [ERR_UNESCAPED_CHARACTERS]: Request path contains unescaped characters"
    urban(encodeURIComponent(response))
        .then(async (res) => {
            const embed = new MessageEmbed()
                .setColor(0x1d2439)
                .setTitle(res.word)
                .setURL(res.urbanURL)
                .setDescription(`**Definition:**\n*${res.definition}*\n\n**Example:**\n*${res.example}*`)
                // [Bug Fix] When an embed field is empty (if the author field is missing, like the top entry for "british"): "RangeError [EMBED_FIELD_VALUE]: MessageEmbed field values may not be empty."
                .addField("Author", res.author || "N/A", true)
                .addField("Rating", `**\`Upvotes: ${res.thumbsUp} | Downvotes: ${res.thumbsDown}\`**`);
            if (res.tags && res.tags.length > 0 && res.tags.join(" ").length < 1024)
                embed.addField("Tags", res.tags.join(", "), true);
            interaction.editReply("Here you go!");
            await interaction.editReply({embeds: [embed]});
        })
        .catch(async () => {
            await interaction.editReply("Sorry, that word was not found.");
        });
}
export default new NamedCommand({
    description: "Gives you a definition of the inputted word.",
    run: "Please input a word.",
    any: new RestCommand({
        async run({send, combined}) {
            // [Bug Fix]: Use encodeURIComponent() when emojis are used: "TypeError [ERR_UNESCAPED_CHARACTERS]: Request path contains unescaped characters"
            urban(encodeURIComponent(combined))
                .then((res) => {
                    const embed = new MessageEmbed()
                        .setColor(0x1d2439)
                        .setTitle(res.word)
                        .setURL(res.urbanURL)
                        .setDescription(`**Definition:**\n*${res.definition}*\n\n**Example:**\n*${res.example}*`)
                        // [Bug Fix] When an embed field is empty (if the author field is missing, like the top entry for "british"): "RangeError [EMBED_FIELD_VALUE]: MessageEmbed field values may not be empty."
                        .addField("Author", res.author || "N/A", true)
                        .addField("Rating", `**\`Upvotes: ${res.thumbsUp} | Downvotes: ${res.thumbsDown}\`**`);
                    if (res.tags && res.tags.length > 0 && res.tags.join(" ").length < 1024)
                        embed.addField("Tags", res.tags.join(", "), true);

                    send({embeds: [embed]});
                })
                .catch(() => {
                    send("Sorry, that word was not found.");
                });
        }
    })
});
