import {Command, NamedCommand} from "../../core";
import figlet from "figlet";

export default new NamedCommand({
    description: "Generates a figlet of your input.",
    async run({message, channel, guild, author, member, client, args}) {
        const input = args.join(" ");
        if (!args[0]) {
            channel.send("You have to provide input for me to create a figlet!");
            return;
        }
        channel.send(
            "```" +
                figlet.textSync(`${input}`, {
                    horizontalLayout: "full"
                }) +
                "```"
        );
    }
});
