import {Command, NamedCommand} from "../../core";
// Anycasting Alert
const translate = require("translate-google");

export default new NamedCommand({
    description: "Translates your input.",
    usage: "<lang ID> <input>",
    async run({message, channel, guild, author, member, client, args}) {
        const lang = args[0];
        const input = args.slice(1).join(" ");
        translate(input, {
            to: lang
        })
            .then((res: any) => {
                channel.send({
                    embed: {
                        title: "Translation",
                        fields: [
                            {
                                name: "Input",
                                value: `\`\`\`${input}\`\`\``
                            },
                            {
                                name: "Output",
                                value: `\`\`\`${res}\`\`\``
                            }
                        ]
                    }
                });
            })
            .catch((err: any) => {
                console.error(err);
                channel.send(
                    `${err}\nPlease use the following list: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes`
                );
            });
    }
});
