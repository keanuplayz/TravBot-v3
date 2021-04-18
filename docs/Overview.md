# Table of Contents

- [Introduction](#introduction)
- [Setting up the development environment](#setting-up-the-development-environment)
- [Adding a new command](#adding-a-new-command)
- [Adding a new non-command feature](#adding-a-new-non-command-feature)

# Introduction

This is a brief overview that'll describe where and how to add new features to TravBot. For more details on specific functions, head over to the [documentation](Documentation.md). TravBot uses the [Onion Lasers Command Handler](https://github.com/WatDuhHekBro/OnionLasers) to load and setup commands. Also, if you ever want to see the definition of a function or its surrounding types and you're using VSCode, put your cursor at the word you want to go to and press `[F12]`.

# Setting up the development environment

1. `npm install`
2. `npm run dev` *(runs the TypeScript compiler in watch mode, meaning any changes you make to the code will automatically reload the bot)*

*Note: Make sure to avoid using `npm run build`! This will remove all your dev dependencies (in order to reduce space used). Instead, use `npm run once` to compile and build in non-dev mode.*

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

client.on("message", (message) => {
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
