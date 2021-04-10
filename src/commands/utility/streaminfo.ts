import {Command, NamedCommand, RestCommand} from "../../core";
import {streamList} from "../../modules/streamNotifications";

export default new NamedCommand({
    description: "Sets the description of your stream. You can embed links by writing `[some name](some link)`",
    async run({send, message, channel, guild, author, member, client, args}) {
        const userID = author.id;

        if (streamList.has(userID)) {
            const stream = streamList.get(userID)!;
            stream.description = "No description set.";
            stream.update();
            send(`Successfully set the stream description to:`, {
                embed: {
                    description: "No description set.",
                    color: member!.displayColor
                }
            });
        } else {
            // Alternatively, I could make descriptions last outside of just one stream.
            send("You can only use this command when streaming.");
        }
    },
    any: new RestCommand({
        async run({send, message, channel, guild, author, member, client, args, combined}) {
            const userID = author.id;

            if (streamList.has(userID)) {
                const stream = streamList.get(userID)!;
                stream.description = combined;
                stream.update();
                send(`Successfully set the stream description to:`, {
                    embed: {
                        description: stream.description,
                        color: member!.displayColor
                    }
                });
            } else {
                // Alternatively, I could make descriptions last outside of just one stream.
                send("You can only use this command when streaming.");
            }
        }
    })
});
