# Table of Contents

- [Introduction](#introduction)
- [Setting up the development environment](#setting-up-the-development-environment)
- [Adding a new command](#adding-a-new-command)
- [Adding a new non-command feature](#adding-a-new-non-command-feature)

# Introduction

This is a brief overview that'll describe where and how to add new features to TravBot. For more details on specific functions, head over to the [documentation](Documentation.md). Assume the prefix for all of these examples is `$`.

# Setting up the development environment

1. `npm install`
2. `npm run dev` *(runs the TypeScript compiler in watch mode, meaning any changes you make to the code will automatically reload the bot)*

*Note: Make sure to avoid using `npm run build`! This will remove all your dev dependencies (in order to reduce space used). Instead, use `npm run once` to compile and build in non-dev mode.*

## Don't forget to...

- ...update the [changelog](../CHANGELOG.md) and any other necessary docs.
- ...update the version numbers in [package.json](../package.json) and [package-lock.json](../package-lock.json).

# Adding a new command

To add a new command, go to `src/commands` and either copy the [template](../src/commands/template.ts) or rename the auto-generated test file (`../src/commands/test.ts`). For reference, this is the barebones requirement for a command file.

## The very basics of a command

```ts
import {NamedCommand} from "../core";

export default new NamedCommand();
```

To make something actually happen when the command is run however, you implement the `run` property.

```ts
import {Command, NamedCommand} from "../core";

export default new NamedCommand({
	async run({message, channel, guild, author, member, client, args}) {
		channel.send("test");
	}
});
```

### Quick note on the run property

You can also enter a string for the `run` property which will send a message with that string specified ([you can also specify some variables in that string](Documentation.md#)). The above is functionally equivalent to the below.

```ts
import {Command, NamedCommand} from "../core";

export default new NamedCommand({
	run: "test"
});
```

## Introducing subcommands

Where this command handler really shines though is from its subcommands feature. You can filter and parse argument lists in a declarative manner.

```ts
import {Command, NamedCommand} from "../core";

export default new NamedCommand({
	user: new Command({
		async run({message, channel, guild, author, member, client, args}) {
			const user = args[0];
		}
	})
});
```

Here, . For example, if this file was named `test.ts`, `$test <@237359961842253835>` would get the user by the ID `237359961842253835` into `args[0]` as a [User](https://discord.js.org/#/docs/main/stable/class/User) object. `$test experiment` would run as if you just called `$test` *(given that [endpoint](Documentation.md#) isn't set to `true`)*.

If you want, you can typecast the argument to be more strongly typed, because the type of `args` is `any[]`. *([See why if you're curious.](DesignDecisions.md#))*

```ts
import {Command, NamedCommand} from "../core";
import {User} from "discord.js";

export default new NamedCommand({
	user: new Command({
		async run({message, channel, guild, author, member, client, args}) {
			const user = args[0] as User;
		}
	})
});
```

## Keyed subcommands

For keyed subcommands, you would instead use a `NamedCommand`.

```ts
import {Command, NamedCommand} from "../core";

export default new NamedCommand({
	run: "one",
	subcommands: {
		bread: new NamedCommand({
			run: "two"
		})
	}
});
```

If the file was named `cat.ts`:
- `$cat` would output `one`
- `$cat bread` would output `two`

Only `bread` in this case would lead to `two` being the output, which is different from the generic subcommand types in previous examples.

You get an additional property with `NamedCommand`s: `aliases`. That means you can define aliases not only for top-level commands, but also every layer of subcommands.

```ts
import {Command, NamedCommand} from "../core";

export default new NamedCommand({
	aliases: ["potato"],
	subcommands: {
		slice: new NamedCommand({
			aliases: ["pear"]
		})
	}
});
```

For example, if this file was named `plant.ts`, the following would work:
- `$plant`
- `$potato`
- `$plant slice`
- `$plant pear`
- `$potato slice`
- `$potato pear`

## Metadata / Command Properties

You can also specify metadata for commands by adding additional properties. Some of these properties are per-command while others are inherited.

```ts
import {Command, NamedCommand} from "../core";

export default new NamedCommand({
	description: "desc one",
	subcommands: {
		pineapple: new NamedCommand({
			//...
		})
	}
});
```

`description` is an example of a per-command property (which is used in a help command). If the file was named `siege.ts`:
- The description of `$siege` would be `desc one`.
- There wouldn't be a description for `$siege pineapple`.

This is in contrast to inherited properties.

```ts
import {Command, NamedCommand, CHANNEL_TYPE} from "../core";

export default new NamedCommand({
	channelType: CHANNEL_TYPE.GUILD,
	subcommands: {
		pineapple: new NamedCommand({
			//...
		})
	}
});
```

Here, the property `channelType` would spread to all subcommands unless a subcommand defines it. Using the above example, the `channelType` for both `$siege` and `$siege pineapple` would be `CHANNEL_TYPE.GUILD`.

*To get a full list of metadata properties, see the [documentation](Documentation.md#).*

## Utility Functions

You'll have to import these manually, however it's in the same import list as `Command` and `NamedCommand`.

```ts
import {Command, NamedCommand, paginate} from "../core";

export default new NamedCommand({
	async run({message, channel, guild, author, member, client, args}) {
		paginate(/* enter your code here */);
	}
});
```

*To get a full list of utility functions, see the [documentation](Documentation.md#).*

# Adding a new non-command feature

If the feature you want to add isn't specifically a command, or the change you're making involves adding event listeners, go to `src/modules` and create a file. Code written here won't be automatically loaded, so make sure to open [src/index.ts](../src/index.ts) and add an import statement at the bottom.

```ts
import "./modules/myModule";
```

This will just run whatever code is in there.

## Listening for events

Rather than have an `events` folder which contains dynamically loaded events, you add an event listener directly via `client.on("...", () => {})`. *([See why if you're curious.](DesignDecisions.md#))* The client can be imported from the index file.

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
