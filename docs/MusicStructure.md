# The commands

```lang-none
- "mhelp"   - Display a help embed.
- "play"    - Adds a song to the queue and plays it.
- "skip"    - Skips the currently playing track.
- "queue"   - Shows the current queue.
- "stop"    - Stops currently playing media and leaves the voice channel.
- "np"      - Displays the currently playing track.
- "pause"   - Pauses the currently playing track.
- "resume"  - Resumes the currently paused track.
- "volume"  - Changes the global volume of the bot.
- "loop"    - Loops the current queue.
- "seek"    - Seeks through the queue.
```

---

Now that the actual info about the functionality of this thing is out of the way, its storytime!

## The music structure

Originally, I, keanucode, aimed to port the music structure of TravBot-v2 to this version.

This would have been much too difficult of a task for three main reasons:

1. The original code is written badly.
2. The original code is written by *another person*.
3. The original code is written in JS.

These three reasons make porting the structure *considerably* harder.

So, of course, I resorted to different matters. I present: [discord.js-lavalink-musicbot](https://github.com/BluSpring/discord.js-lavalink-musicbot). ([npmjs.org](https://www.npmjs.com/package/discord.js-lavalink-musicbot))

This *pre-built* module utilises [Lavalink](https://github.com/Frederikam/Lavalink), which is an audio sending node based on [Lavaplayer](https://github.com/sedmelluq/lavaplayer) and [JDA-Audio](https://github.com/DV8FromTheWorld/JDA-Audio).

I've previously considered using Lavalink, but it turned out to be more difficult for me to implement than I thought.

So, I tried again with `discord.js-lavalink-musicbot`.

*ahem*...

**The library was written in such a way that it didn't work!**

---

## Fixing the broken library

First off; in the library's interface `LavaLinkNodeOptions`, option `id` was a *required* option:

```ts
interface LavalinkNodeOptions {
    host: string;
    id: string;
    /* ... */
}
```

Here's the catch. `id` was referenced *nowhere* in the library code.
It was *literally* useless.

So, I lazily removed that by adding a `?` to the parameter. (`id?:`)

Next up:

```ts
declare function LavalinkMusic(client: Client, options: MusicbotOptions) {}
```

First up, the TS compiler reports that: `An implementation cannot be declared in ambient contexts. ts(1183)`

Secondly, this function, which makes up the entirety of the library, explicitly returns an `any` type. As you can see, the *declared* function returns... no specific type.

So, that had to be changed to:

```diff
- declare function LavalinkMusic(client: Client, options: MusicbotOptions) {}
+ declare function LavalinkMusic(client: Client, options: MusicbotOptions): any
```

...next up:

```ts
try {
const res = await axios.get(
    /* ... */
    `https://${music.lavalink.restnode.host}:`
    /* ... */
)
```

The library tries to fetch the URL of the Lavalink node. With *HTTPS*.

I think you can see where this is going. An SSL error.

Changed the `https` to `http`, and all is well.

I republished the library under the name "[discord.js-lavalink-lib](https://npmjs.org/package/discord.js-lavalink-lib)" so I can easily install the non-broken version.

---

## Implementing the functionality

There's nothing much to do there, honestly. Only one edit to the original snippet has to be made.

The original example snippet has the following:

```ts
const Discord = require('discord.js');
const client = new Discord.Client();
client.music = new (require('discord.js-lavalink-musicbot'))(client, {
    /* ...config... */
});
```

As you can see, this is... kind of disgusting. And on top of that, incompatible with TS.

So, we have to change a few things. First off, since TS is strict, it'll tell you that `music` doesn't exist on `client`. Which is true. The `Client` class has no `music` property.

So, we make `client.` an `any` type using keyword `as`:

```ts
const Discord = require('discord.js');
const client = new Discord.Client();
(client as any).music = LavalinkMusic(client, {
  /* ...config... */
});
```

And that's about it. Launch up Lavalink, and start the bot.
