import {NamedCommand, RestCommand} from "onion-lasers";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageEmbed, CommandInteraction} from "discord.js";
import {find} from "weather-js";

export const header = new SlashCommandBuilder()
    .setDescription("Shows weather info of specified location.")
    .addStringOption((option) =>
        option.setName("location").setDescription("The location you're looking for").setRequired(true)
    );

export async function handler(interaction: CommandInteraction) {
    const {options} = interaction;
    await interaction.reply("Working on it....");
    const response = options.getString("location", true);

    find(
        {
            search: response,
            degreeType: "C"
        },
        async function (error, result) {
            if (error) return await interaction.editReply(error.toString());
            if (result.length === 0) return await interaction.editReply("No city found by that name.");
            var current = result[0].current;
            var location = result[0].location;
            const embed = new MessageEmbed()
                .setDescription(`**${current.skytext}**`)
                .setAuthor(`Weather for ${current.observationpoint}`)
                .setThumbnail(current.imageUrl)
                .setColor(0x00ae86)
                .addField("Timezone", `UTC${location.timezone}`, true)
                .addField("Degree Type", "C", true)
                .addField("Temperature", `${current.temperature} Degrees`, true)
                .addField("Feels like", `${current.feelslike} Degrees`, true)
                .addField("Winds", current.winddisplay, true)
                .addField("Humidity", `${current.humidity}%`, true);
            interaction.editReply("Here you go!"); // remove the working on message
            return await interaction.editReply({
                embeds: [embed]
            });
        }
    );
}
export default new NamedCommand({
    description: "Shows weather info of specified location.",
    run: "You need to provide a city.",
    any: new RestCommand({
        async run({send, combined}) {
            find(
                {
                    search: combined,
                    degreeType: "C"
                },
                function (error, result) {
                    if (error) return send(error.toString());
                    if (result.length === 0) return send("No city found by that name.");
                    var current = result[0].current;
                    var location = result[0].location;
                    const embed = new MessageEmbed()
                        .setDescription(`**${current.skytext}**`)
                        .setAuthor(`Weather for ${current.observationpoint}`)
                        .setThumbnail(current.imageUrl)
                        .setColor(0x00ae86)
                        .addField("Timezone", `UTC${location.timezone}`, true)
                        .addField("Degree Type", "C", true)
                        .addField("Temperature", `${current.temperature} Degrees`, true)
                        .addField("Feels like", `${current.feelslike} Degrees`, true)
                        .addField("Winds", current.winddisplay, true)
                        .addField("Humidity", `${current.humidity}%`, true);
                    return send({
                        embeds: [embed]
                    });
                }
            );
        }
    })
});
