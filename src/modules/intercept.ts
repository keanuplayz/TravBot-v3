import {client} from "../index";

// Potentially port CE's intercept module to here?
// - ` ${text} `.test(/[ \.,\?!]hon[ \.,\?!]/)
// - "oil" will remain the same though, it's better that way (anything even remotely "oil"-related calls the image)
// - Also uwu and owo penalties

client.on("message", (message) => {
    if (message.content.toLowerCase().includes("remember to drink water")) {
        message.react("🚱");
    }
});
