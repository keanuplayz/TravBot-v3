// This will keep track of the last event that occurred to provide context to error messages.
// Like with logging each command invocation, it's not a good idea to pollute the logs with this kind of stuff when it works most of the time.
// However, it's also a pain to debug when no context is provided for an error message.
import {client} from "..";

let lastEvent = "N/A";

// A generic process handler is set to catch unhandled rejections other than the ones from Lavalink and Discord.
process.on("unhandledRejection", (reason: any) => {
    const isLavalinkError = reason?.code === "ECONNREFUSED";
    const isDiscordError = reason?.name === "DiscordAPIError";

    if (!isLavalinkError)
        if (!isDiscordError || lastEvent !== "message")
            // If it's a DiscordAPIError on a message event, I'll make the assumption that it comes from the command handler.
            console.error(`@${lastEvent}\n${reason.stack}`);
});

// This will dynamically attach all known events instead of doing it manually.
// As such, it needs to be placed after all other events are attached or the tracking won't be done properly.
for (const event of client.eventNames()) {
    client.on(event, () => (lastEvent = event.toString()));
}
