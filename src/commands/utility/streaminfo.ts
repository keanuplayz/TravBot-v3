import {Command, NamedCommand} from "../../core";
import {streamList} from "../../modules/streamNotifications";

export default new NamedCommand({
    description: "Sets the description of your stream. You can embed links by writing `[some name](some link)`",
    async run({message, channel, guild, author, member, client, args}) {
        const userID = author.id;

        if (streamList.has(userID)) {
            const stream = streamList.get(userID)!;
            stream.description = args.join(" ") || "No description set.";
            stream.update();
        } else {
            // Alternatively, I could make descriptions last outside of just one stream.
            channel.send("You can only use this command when streaming.");
        }
    }
});
