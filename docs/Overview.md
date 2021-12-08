# Table of Contents

- [Introduction](#introduction)
- [Setting up the development environment](#setting-up-the-development-environment)
- [Adding a new command](#adding-a-new-command)
- [Adding a new non-command feature](#adding-a-new-non-command-feature)
- [Notes](#notes)

# Introduction

This is a brief overview that'll describe where and how to add new features to TravBot. For more details on specific functions, head over to the [documentation](Documentation.md). TravBot uses the [Onion Lasers Command Handler](https://github.com/WatDuhHekBro/OnionLasers) to load and setup commands. Also, if you ever want to see the definition of a function or its surrounding types and you're using VSCode, put your cursor at the word you want to go to and press `[F12]`.

# Setting up the development environment

1. `npm install`
2. `npm run dev` *(runs the TypeScript compiler in watch mode, meaning any changes you make to the code will automatically reload the bot)*

*Note: Make sure to avoid using `npm run build`! This will remove all your dev dependencies (in order to reduce space used). Instead, use `npm run once` to compile and build in non-dev mode.*

*Note: `npm run dev` will automatically delete any leftover files, preventing errors that might occur because of it. However, sometimes you'd like to test stuff without that build step. To do that, run `npm run dev-fast`. You'll then have to manually delete the `dist` folder to clear any old files.*

*Note: If you update one of the APIs or utility functions, make sure to update the [documentation](Documentation.md).*

# Adding a new command

To add a new command, go to `src/commands` and create a new `.ts` file named as the command name. Then, use and expand upon the following template.

```ts
import {Command, NamedCommand, RestCommand} from "onion-lasers";

export default new NamedCommand({
    async run({send, message, channel, guild, author, member, client, args}) {
        // code
    }
});
```

# Adding a new non-command feature

If the feature you want to add isn't specifically a command, or the change you're making involves adding event listeners, go to `src/modules` and create a file. Code written here won't be automatically loaded, so make sure to open [src/index.ts](../src/index.ts) and add an import statement at the bottom.

```ts
import "./modules/myModule";
```

This will just run whatever code is in there.

## Listening for events

Rather than have an `events` folder which contains dynamically loaded events, you add an event listener directly via `client.on("...", () => {})`. *([See why if you're curious.](https://github.com/WatDuhHekBro/OnionLasers/blob/master/README.md#static-event-loading))* The client can be imported from the index file.

```ts
import {client} from "..";

client.on("messageCreate", (message) => {
	//...
});
```

As long as you make sure to add that import statement in the index file itself, the event(s) will load.

**Just make sure you instantiate the client *before* you import a module or you'll get a runtime error.**

`index.ts`
```ts
import {Client} from "discord.js";

export const client = new Client();

//...

import "./modules/myModule";
```

# Notes

## Logger

All calls to `console.error`, `console.warn`, `console.log`, and `console.debug` will also add to an in-memory log you can download, noted by verbosity levels `Error`, `Warn`, `Info`, and `Verbose` respectively.
- `Error`: This indicates stuff that could or is breaking at least some functionality of the bot.
- `Warn`: This indicates stuff that should probably be fixed but isn't going to break the bot.
- `Info`: Used for general events such as joining/leaving guilds for example, but try not to go overboard on logging everything.
- `Verbose`: This is used as a sort of separator for logging potentially error-prone events so that if an error occurs, you can find the context that error originated from.
- In order to make reading the logs easier, context should be provided with each call. For example, if a call is being made from the storage module, you'd do something like `console.log("[storage]", "the message")`.
    - If a message is clear enough as to what the context was though, it's probably unnecessary to include this prefix. However, you should definitely attach context prefixes to error objects, who knows where those might originate.
