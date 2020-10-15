import Event from '../core/event';
import { client } from '../index';
import $ from '../core/lib';
import { Config } from '../core/structures';

export default new Event<'ready'>({
  once() {
    if (client.user) {
      $.ready(
        `Logged in as ${client.user.username}#${client.user.discriminator}.`,
      );
      client.user.setActivity({
        type: 'LISTENING',
        name: `${Config.prefix}help`,
      });
    }
  },
});
