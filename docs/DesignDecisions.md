# Using the Command Class

## any[] Parameters For Subcommand Run

Unless there's some sort of TypeScript wizardry to solve this, the `args` parameter in the subcommand type will have to be `any[]` because it's simply too context-dependent to statically figure it out.
- Each subcommand is its own layer which doesn't know about parent commands at compile-time.
- Subcommands can be split into different files for code maintainability.
- Even though the last argument is able to be strongly-typed, if you have multiple parameters, you'd essentially only get static benefits for one of the arguments, and you wouldn't even know the location of that one argument.
- Overall, it's just easier to use your best judgement then use type assertions.

## Channel Type Type Guards

As of right now, it's currently not feasible to implement type guards for channel types. [Discriminated unions with a default parameter don't work with callbacks.](https://github.com/microsoft/TypeScript/issues/41759) In order to implement type guards, the `channelType` parameter would have to be required, making each command layer quite tedious.

So instead, use non-null assertions when setting the `channelType`. For example:

```ts
import {Command, NamedCommand, CHANNEL_TYPE} from "../core";
import {TextChannel} from "discord.js";

export default new NamedCommand({
	channelType: CHANNEL_TYPE.GUILD,
	async run({message, channel, guild, author, member, client, args}) {
		console.log(guild!.name);
		console.log(member!.nickname);
		console.log((channel as TextChannel).name !== "dm");
	}
});
```

```ts
import {Command, NamedCommand, CHANNEL_TYPE} from "../core";
import {DMChannel} from "discord.js";

export default new NamedCommand({
	channelType: CHANNEL_TYPE.DM,
	async run({message, channel, guild, author, member, client, args}) {
		console.log(guild === null);
		console.log(member === null);
		console.log((channel as DMChannel).type === "dm");
	}
});
```

The three guarantees are whether or not `guild` will be `null`, whether or not `member` will be `null`, and the type of `channel`.

*Take note that `member` can still be `null` even in a guild (for example, if you target a message by someone who left), `member` cannot be `null` here because the `message` being sent must be by someone who is in the guild by this point.*

## Uneven Return Paths

`Command.run` doesn't use the return values for anything, so it's safe to do `return channel.send(...)` to merge those two statements. However, you'll come across an error: `Not all code paths return a value.`

There are several ways to resolve this issue:
- Split all `return channel.send(...)` statements to `{channel.send(...); return;}`
- Set an explicit any return type in the function header: `async run(...): Promise<any> {`
- Add an extra `return` statement at the end of each path

## Type Guards

The `Command` class is implemented in a certain way to provide type guards which reduce unnecessary properties at compile-time rather than warning the user at runtime.
- The reason `NamedCommand` (which extends `Command`) exists is to provide a type guard for `aliases`. After all, `aliases` doesn't really make sense for generic subcommand types - how would you handle an alias for a type that accepts a number for example?
- The `endpoint` property changes what other properties are available via a discriminated union. If `endpoint` is `true`, no subcommands of any type can be defined. After all, it wouldn't make sense logically.

## Boolean Types

Boolean subcommand types won't be implemented:
- Since there are only two values, why not just put it under `subcommands`?
- If boolean types were to be implemented, how many different types of input would have to be considered? `yes`/`no`, `y`/`n`, `true`/`false`, `1`/`0`, etc.

## Hex and Octal Number Types

For common use cases, there wouldn't be a need to go accept numbers of different bases. The only time it would be applicable is if there was some sort of base converter command, and even then, it'd be better to just implement custom logic.

## User Mention + Search by Username Type

While it's a pretty common pattern, it's probably a bit too specific for the `Command` class itself. Instead, this pattern will be comprised of two subcommands: A `user` type and an `any` type.

# The Command Handler

## The Scope of the Command Handler

What this does:
- Provides the `Command`/`NamedCommand` classes.
- Dynamically loads commands and attaches runtime metadata.
- Provides utility functions specific to Discord to make certain patterns of commands less tedious to implement.

What this doesn't do:
- Manage the general file system or serialization/deserialization of data.
- Provide general utility functions.
- Provide any Discord-related functionality besides strictly command handling.

## Client Creation

Creating the client is beyond the scope of the command handler and will not be abstracted away. Instead, the user will simply attach the command handler to the client to initialize it.
- This makes it so if a user wants to specify their own `ClientOptions` when instantiating the client, it's less troublesome to implement.
- The user can export the client and use it throughout different parts of their code.

## Bot-Specific Mentions

Pinging the bot will display the current guild prefix. The bot mention will not serve as an alternate prefix.
- When talking about a bot, the bot might be pinged to show who it is. It could be in the middle (so don't listen for a prefix anywhere) or it could be at the start (so only listen to a standalone ping).
- It likely isn't a common use case to ping the bot. The only time it would really shine is in the event two bots have a prefix conflict, but the command that changes prefixes can simply add a parameter to deal with that case. For example, instead of `@bot set prefix <prefix>`, you'd use `set prefix <prefix> @bot`.

## Direct Messages

When direct messaging a bot, no prefixes will be used at all because it's assumed that you're executing a command. Because the only people allowed is the user and the bot, NSFW-only commands can also be executed here.

## Permission Setup

Because the command handler provides no specific permission set, it's up to the user to come up with functions to add permissions as well as create the enum that assigns permissions.
- The `permission` property of a `Command` instance is `-1` by default, which means to inherit the permission level from the parent command. If you want, you can create your enum like this: `enum Permissions {INHERIT = -1, USER, ADMIN}`, where `Permissions.USER = 0` and `Permissions.ADMIN = 1`.

# Miscellaneous

## Static Event Loading

While dynamic loading fits very well with commands, it was more or less clunky design to try and make events fit the same model:
- There are no restrictions when it comes to command names, and the name of the file will determine the name of the command, which avoids repetition. Events on the other hand involved lots of boilerplate to get static types back.
- Since there can be multiple listeners per event, large event files can be split up into more organized blocks.
- Likewise, small event listeners which span multiple events can be grouped together like `channelCreate` and `channelDelete`, showing the relation in one single file rather than splitting them up just because they're two different events.

## Testing

For TravBot, there'll be two types of tests: standard unit tests and manual integration tests.
- Standard unit tests are executed only on isolated functions and are part of the pre-commit hook.
- Somehow, including the bot in an import chain will cause the system to crash (same error message as [this](https://stackoverflow.com/questions/66102858/discord-clientuser-is-not-a-constructor)). That's why the integration tests are manually done. There would be a list of inputs and outputs to check of each command for tests while simultaneously serving as a help menu with examples of all possible inputs/outputs for others to see.
- An idea which will not be implemented is prompting the user for inputs during the tests. This is no better than manual tests, worse actually, because if this had to run before each commit, it'd quickly become a nightmare.
- Maybe take some ideas from something like [this](https://github.com/stuyy/jest-unit-tests-demo) in the future to get tests to properly work.
- Another possibility is to use `client.emit(...)` then mock the `message.channel.send(...)` function which would listen if the input is correct.
