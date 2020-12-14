import { Client } from 'discord.js';
import setup from './setup';
import { Config } from './core/structures';
import { loadCommands } from './core/command';
import { loadEvents } from './core/event';
import 'discord.js-lavalink-lib';
import LavalinkMusic from 'discord.js-lavalink-lib';

// This is here in order to make it much less of a headache to access the client from other files.
// This of course won't actually do anything until the setup process is complete and it logs in.
export const client = new Client();

(client as any).music = LavalinkMusic(client, {
  lavalink: {
    restnode: {
      host: 'localhost',
      port: 2333,
      password: 'youshallnotpass',
    },
    nodes: [
      {
        host: 'localhost',
        port: 2333,
        password: 'youshallnotpass',
      },
    ],
  },
  prefix: '!!',
  helpCmd: 'mhelp',
  admins: ['717352467280691331'],
});

// Begin the command loading here rather than when it's needed like in the message event.
setup.init().then(() => {
  loadCommands();
  loadEvents(client);
  client.login(Config.token).catch(setup.again);
});
