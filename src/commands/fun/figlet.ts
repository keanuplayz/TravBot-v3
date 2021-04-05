import Command from "../../core/command";
import figlet from "figlet";

export default new Command({
    description: "Generates a figlet of your input.",
    async run($) {
        const input = $.args.join(" ");
        if (!$.args[0]) {
            $.channel.send("You have to provide input for me to create a figlet!");
            return;
        }
        $.channel.send(
            "```" +
                figlet.textSync(`${input}`, {
                    horizontalLayout: "full"
                }) +
                "```"
        );
    }
});
