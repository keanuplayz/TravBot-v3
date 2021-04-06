import Command from "../../core/command";
import {MessageEmbed} from "discord.js";
// Anycasting Alert
const weather = require("weather-js");

export default new Command({
    description: "Shows weather info of specified location.",
    async run($) {
        if ($.args.length == 0) {
            $.channel.send("You need to provide a city.");
            return;
        }
        weather.find(
            {
                search: $.args.join(" "),
                degreeType: "C"
            },
            function (err: any, result: any) {
                if (err) $.channel.send(err);
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
                $.channel.send({
                    embed
                });
            }
        );
    }
});
