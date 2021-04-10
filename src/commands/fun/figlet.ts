import {Command, NamedCommand, RestCommand} from "../../core";
import figlet from "figlet";

export default new NamedCommand({
    description: "Generates a figlet of your input.",
    run: "You have to provide input for me to create a figlet!",
    any: new RestCommand({
        async run({send, message, channel, guild, author, member, client, args, combined}) {
            return send(
                figlet.textSync(combined, {
                    horizontalLayout: "full"
                }),
                {
                    code: true
                }
            );
        }
    })
});
