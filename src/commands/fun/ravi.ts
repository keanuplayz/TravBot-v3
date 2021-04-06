import {Command, NamedCommand} from "../../core";
import {Random} from "../../lib";

export default new NamedCommand({
    description: "Ravioli ravioli...",
    usage: "[number from 1 to 9]",
    async run({message, channel, guild, author, member, client, args}) {
        channel.send({
            embed: {
                title: "Ravioli ravioli...",
                image: {
                    url: `https://raw.githubusercontent.com/keanuplayz/TravBot/master/assets/ravi${Random.int(
                        1,
                        10
                    )}.png`
                }
            }
        });
    },
    number: new Command({
        async run({message, channel, guild, author, member, client, args}) {
            const arg: number = args[0];

            if (arg >= 1 && arg <= 9) {
                channel.send({
                    embed: {
                        title: "Ravioli ravioli...",
                        image: {
                            url: `https://raw.githubusercontent.com/keanuplayz/TravBot/master/assets/ravi${arg}.png`
                        }
                    }
                });
            } else {
                channel.send("Please provide a number between 1 and 9.");
            }
        }
    })
});