import {Command, NamedCommand, RestCommand} from "onion-lasers";
import translate from "translate-google";

export default new NamedCommand({
    description: "Translates your input.",
    usage: "<lang ID> <input>",
    run: "You need to specify a language to translate to.",
    any: new Command({
        run: "You need to enter some text to translate.",
        any: new RestCommand({
            async run({send, args}) {
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
                        send(
                            `${error}\nPlease use the following list: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes`
                        );
                    });
            }
        })
    })
});
