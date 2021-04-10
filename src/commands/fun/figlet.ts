import {Command, NamedCommand} from "../../core";
import figlet from "figlet";

export default new NamedCommand({
    description: "Generates a figlet of your input.",
    async run({send, message, channel, guild, author, member, client, args}) {
        const input = args.join(" ");
        if (!args[0]) return send("You have to provide input for me to create a figlet!");
        return send(
            "```" +
                figlet.textSync(`${input}`, {
                    horizontalLayout: "full"
                }) +
                "```"
        );
    }
});
