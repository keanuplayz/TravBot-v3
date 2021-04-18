import {client} from "../index";

client.on("message", (message) => {
    if (message.content.toLowerCase().includes("remember to drink water")) {
        message.react("🚱");
    }
});
