import attachClientToLavalink from "discord.js-lavalink-lib";
import {Config} from "../structures";
import {client} from "../index";

// Although the example showed to do "client.music = LavaLink(...)" and "(client as any).music = Lavalink(...)" was done to match that, nowhere in the library is client.music ever actually used nor does the function return anything. In other words, client.music is undefined and is never used.
attachClientToLavalink(client, {
    lavalink: {
        restnode: {
            host: "localhost",
            port: 2333,
            password: "youshallnotpass"
        },
        nodes: [
            {
                host: "localhost",
                port: 2333,
                password: "youshallnotpass"
            }
        ]
    },
    prefix: Config.prefix,
    helpCmd: "mhelp",
    admins: ["717352467280691331"]
});

// Disable the unhandledRejection listener by Lavalink because it captures every single unhandled
// rejection and adds its message with it. Then replace it with a better, more selective error handler.
for (const listener of process.listeners("unhandledRejection")) {
    if (listener.toString().includes("discord.js-lavalink-musicbot")) {
        process.off("unhandledRejection", listener);
    }
}

process.on("unhandledRejection", (reason: any) => {
    if (reason?.code === "ECONNREFUSED") {
        // This is console.warn instead of console.error because on development environments, unless Lavalink is being tested, it won't interfere with the bot's functionality.
        console.warn(
            `[discord.js-lavalink-musicbot] Caught unhandled rejection: ${reason.stack}\nIf this is causing issues, head to the support server at https://discord.gg/dNN4azK`
        );
    }
});

// It's unsafe to process uncaughtException because after an uncaught exception, the system
// becomes corrupted. So disable Lavalink from adding a hook to it.
for (const listener of process.listeners("uncaughtException")) {
    if (listener.toString().includes("discord.js-lavalink-musicbot")) {
        process.off("uncaughtException", listener);
    }
}
