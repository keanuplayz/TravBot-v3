import {NamedCommand, RestCommand} from "onion-lasers";
import {MessageEmbed} from "discord.js";
import {find} from "weather-js";

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
                        embed
                    });
                }
            );
        }
    })
});
