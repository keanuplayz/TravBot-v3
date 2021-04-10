import {Command, NamedCommand} from "../../core";
import translate from "translate-google";

export default new NamedCommand({
    description: "Translates your input.",
    usage: "<lang ID> <input>",
    async run({send, message, channel, guild, author, member, client, args}) {
        const lang = args[0];
        const input = args.slice(1).join(" ");
        translate(input, {
            to: lang
        })
            .then((res) => {
                send({
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
            .catch((error) => {
                console.error(error);
                send(`${error}\nPlease use the following list: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes`);
            });
    }
});
