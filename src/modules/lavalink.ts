import attachClientToLavalink from "discord.js-lavalink-lib";
import {Config} from "../core/structures";
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
