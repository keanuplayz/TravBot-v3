import {NamedCommand} from "onion-lasers";

export default new NamedCommand({
    description: "Initiates a celebratory stream from the bot.",
    async run({send, client}) {
        send("This calls for a celebration!");
        client.user!.setActivity({
            type: "STREAMING",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            name: "Celebration!"
        });
    }
});
