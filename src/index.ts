import "./globals";
import {Client} from "discord.js";
import setup from "./setup";
import {Config} from "./core/structures";
import {loadEvents} from "./core/event";
import {attachToClient} from "./modules/lavalink";

// This is here in order to make it much less of a headache to access the client from other files.
// This of course won't actually do anything until the setup process is complete and it logs in.
export const client = new Client();
attachToClient(client);

// Command loading will start as soon as an instance of "core/command" is loaded, which is loaded during "events/message".
setup.init().then(() => {
    loadEvents(client);
    client.login(Config.token).catch(setup.again);
});
