import { Client, ClientEvents, Constants } from 'discord.js';
import Storage from './storage';
import $ from './lib';

interface EventOptions<K extends keyof ClientEvents> {
  readonly on?: (...args: ClientEvents[K]) => void;
  readonly once?: (...args: ClientEvents[K]) => void;
}

export default class Event<K extends keyof ClientEvents> {
  private readonly on?: (...args: ClientEvents[K]) => void;
  private readonly once?: (...args: ClientEvents[K]) => void;

  constructor(options: EventOptions<K>) {
    this.on = options.on;
    this.once = options.once;
  }

  // For this function, I'm going to assume that the event is used with the correct arguments and that the event tag is checked in "storage.ts".
  public attach(client: Client, event: K) {
    if (this.on) client.on(event, this.on);
    if (this.once) client.once(event, this.once);
  }
}

export async function loadEvents(client: Client) {
  for (const file of Storage.open('dist/events', (filename: string) =>
    filename.endsWith('.js'),
  )) {
    const header = file.substring(0, file.indexOf('.js'));
    const event = (await import(`../events/${header}`)).default;

    if ((Object.values(Constants.Events) as string[]).includes(header)) {
      event.attach(client, header);
      $.log(`Loading Event: ${header}`);
    } else
      $.warn(
        `"${header}" is not a valid event type! Did you misspell it? (Note: If you fixed the issue, delete "dist" because the compiler won't automatically delete any extra files.)`,
      );
  }
}
