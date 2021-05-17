// This will keep track of the last event that occurred to provide context to error messages.
// Like with logging each command invocation, it's not a good idea to pollute the logs with this kind of stuff when it works most of the time.
// However, it's also a pain to debug when no context is provided for an error message.
import {client} from "..";
import {setExecuteCommandListener} from "onion-lasers";
import {TextChannel, DMChannel, NewsChannel} from "discord.js";

let lastEvent = "N/A";
let lastCommandInfo: {
    header: string;
    args: string[];
    channel: TextChannel | DMChannel | NewsChannel | null;
} = {
    header: "N/A",
    args: [],
    channel: null
};

process.on("unhandledRejection", (reason: any) => {
    const isLavalinkError = reason?.code === "ECONNREFUSED";
    const isDiscordError = reason?.name === "DiscordAPIError";

    if (!isLavalinkError) {
        // If it's a DiscordAPIError on a message event, I'll make the assumption that it comes from the command handler.
        // That's not always the case though, especially if you add your own message events. Just be wary of that.
        if (isDiscordError && lastEvent === "message") {
            console.error(
                `Command Error: ${lastCommandInfo.header} (${lastCommandInfo.args.join(", ")})\n${reason.stack}`
            );
            lastCommandInfo.channel?.send(
                `There was an error while trying to execute that command!\`\`\`${reason.stack}\`\`\``
            );
        } else {
            console.error(
                `@${lastEvent} : /${lastCommandInfo.header} (${lastCommandInfo.args.join(", ")})\n${reason.stack}`
            );
        }
    }
});

// Store info on which command was executed last.
setExecuteCommandListener(({header, args, channel}) => {
    lastCommandInfo = {
        header,
        args,
        channel
    };
});

// This will dynamically attach all known events instead of doing it manually.
// As such, it needs to be placed after all other events are attached or the tracking won't be done properly.
for (const event of client.eventNames()) {
    client.on(event, () => {
        lastEvent = event.toString();
    });
}
