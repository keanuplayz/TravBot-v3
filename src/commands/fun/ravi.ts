import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Command, NamedCommand} from "onion-lasers";
import {Random} from "../../lib";
//Ravioli ravioli...
//number from 1 to 9
export const header = new SlashCommandBuilder()
    .setDescription("Ravioli ravioli...")
    .addIntegerOption((option) => option.setName("number").setDescription("Number from 1 to 9").setRequired(false));

export async function handler(interaction: CommandInteraction) {
    const {options} = interaction;
    try {
        //get the number from the options if it fails fallback to the randomizer
        var response = options.getInteger("number", true);
    } catch (e) {
        var response = Random.int(1, 10);
    }
    console.log(response);

    interaction.reply({
        embeds: [
            {
                title: "Ravioli ravioli...",
                image: {
                    url: `https://raw.githubusercontent.com/keanuplayz/TravBot/master/assets/ravi${response}.png`
                }
            }
        ]
    });
}
export default new NamedCommand({
    description: "Ravioli ravioli...",
    usage: "[number from 1 to 9]",
    async run({send}) {
        send({
            embeds: [
                {
                    title: "Ravioli ravioli...",
                    image: {
                        url: `https://raw.githubusercontent.com/keanuplayz/TravBot/master/assets/ravi${Random.int(
                            1,
                            10
                        )}.png`
                    }
                }
            ]
        });
    },
    number: new Command({
        async run({send, args}) {
            const arg: number = args[0];

            if (arg >= 1 && arg <= 9) {
                send({
                    embeds: [
                        {
                            title: "Ravioli ravioli...",
                            image: {
                                url: `https://raw.githubusercontent.com/keanuplayz/TravBot/master/assets/ravi${arg}.png`
                            }
                        }
                    ]
                });
            } else {
                send("Please provide a number between 1 and 9.");
            }
        }
    })
});
