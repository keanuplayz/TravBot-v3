// Bootstrapping Section //
import "./modules/globals";
import {Client} from "discord.js";
import setup from "./modules/setup";
import {Config} from "./core/structures";

// This is here in order to make it much less of a headache to access the client from other files.
// This of course won't actually do anything until the setup process is complete and it logs in.
export const client = new Client();

// Send the login request to Discord's API and then load modules while waiting for it.
setup.init().then(() => {
    client.login(Config.token).catch(setup.again);
});

// Initialize Modules //
import "./core/handler"; // Command loading will start as soon as an instance of "core/command" is loaded, which is loaded in "core/handler".
import "./modules/presence";
import "./modules/lavalink";
import "./modules/emoteRegistry";
import "./modules/channelListener";
