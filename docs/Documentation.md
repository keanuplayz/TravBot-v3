# What this is
This is a user-friendly version of the project's structure (compared to the amalgamation that has become [specifications](Specifications.md) which is just a list of design decisions and isn't actually helpful at all for understanding the code). This will follow the line of logic that the program would run through.

# Building/Setup
- `npm run dev` runs the TypeScript compiler in watch mode, meaning that any changes you make to the code will automatically reload the bot.
- This will take all the files in `src` (where all the code is) and compile it into `dist` which is what the program actually uses.
	- If there's a runtime error, `dist\commands\test.js:25:30` for example, then you have to into `dist` instead of `src`, then find the line that corresponds.

# Launching
When you start the program, it'll run the code in `index` (meaning both `src/index.ts` and `dist/index.js`, they're the same except that `dist/<...>.js` is compiled). The code in `index` will call `setup` and check if `data/config.json` exists, prompting you if it doesn't. It'll then run initialization code.

# Structure
- `commands` contains all the commands.
- `defs` contains static definitions.
- `core` contains the foundation of the program. You won't need to worry about this unless you're modifying pre-existing behavior of the `Command` class for example or add a function to the library.
- `events` contains all the events. Again, you generally won't need to touch this unless you're listening for a new Discord event.

# The Command Class
A valid command file must be located in `commands` and export a default `Command` instance. Assume that we're working with `commands/money.ts`.
```js
import Command from '../core/command';

export default new Command({
	//...
});
```
The `run` property can be either a function or a string. If it's a function, you get one parameter, `$` which represents the common library (see below). If it's a string, it's a variable string.
- `%author%` pings the person who sent the message.
- `%prefix%` gets the bot's current prefix in the selected server.
```js
import Command from '../core/command';
import {CommonLibrary} from '../core/lib';

export default new Command({
	run: "%author%, make sure to use the prefix! (%prefix)"
});
```
...is equal to...
```js
import Command from '../core/command';
import {CommonLibrary} from '../core/lib';
import {getPrefix} from "../core/structures";

export default new Command({
	async run($: CommonLibrary): Promise<any> {
		$.channel.send(`${$.author.toString()}, make sure to use the prefix! (${getPrefix($.guild)})`);
	}
});
```
Now here's where it gets fun. The `Command` class is a recursive structure, containing other `Command` instances as properties.
- `subcommands` is used for specific keywords for accessing a certain command. For example, `$eco pay` has a subcommand of `pay`.
```js
import Command from '../core/command';
import {CommonLibrary} from '../core/lib';

export default new Command({
	subcommands: {
		pay: new Command({
			//...
		})
	}
});
```
There's also `user` which listens for a ping or a Discord ID, `<@237359961842253835>` and `237359961842253835` respectively. The argument will be a `User` object.
```js
import Command from '../core/command';
import {CommonLibrary} from '../core/lib';

export default new Command({
	user: new Command({
		async run($: CommonLibrary): Promise<any> {
			$.debug($.args[0].username); // "WatDuhHekBro"
		}
	})
});
```
There's also `number` which checks for any number type except `Infinity`, converting the argument to a `number` type.
```js
import Command from '../core/command';
import {CommonLibrary} from '../core/lib';

export default new Command({
	number: new Command({
		async run($: CommonLibrary): Promise<any> {
			$.debug($.args[0] + 5);
		}
	})
});
```
And then there's `any` which catches everything else that doesn't fall into the above categories. The argument will be a `string`.
```js
import Command from '../core/command';
import {CommonLibrary} from '../core/lib';

export default new Command({
	any: new Command({
		async run($: CommonLibrary): Promise<any> {
			$.debug($.args[0].toUpperCase());
		}
	})
});
```
Of course, maybe you just want to get string arguments regardless, and since everything is an optional property, so you'd then just include `any` and not `subcommands`, `user`, or `number`.

## Other Properties
- `description`: The description for that specific command.
- `endpoint`: A `boolean` determining whether or not to prevent any further arguments. For example, you could prevent `$money daily too many arguments`.
- `usage`: Provide a custom usage for the help menu. Do note that this is relative to the subcommand, so the below will result in `$money pay <user> <amount>`.
```js
import Command from '../core/command';
import {CommonLibrary} from '../core/lib';

export default new Command({
	subcommands: {
		pay: new Command({
			usage: "<user> <amount>"
		})
	}
});
```
- `permission`: The permission to restrict the current command to. You can specify it for certain subcommands, useful for having `$money` be open to anyone but not `$money admin`. If it's `null` (default), the permission will inherit whatever was declared before (if any). The default value is NOT the same as `Command.PERMISSIONS.NONE`.
- `aliases`: A list of aliases (if any).

## Alternatives to Nesting
For a lot of the metadata properties like `description`, you must provide them when creating a new `Command` instance. However, you can freely modify and attach subcommands, useful for splitting a command into multiple files.
```js
import pay from "./subcommands/pay";

const cmd = new Command({
	description: "Handle your money."
});
cmd.subcommands.set("pay", pay);
cmd.run = async($: CommonLibrary): Promise<any> {
	$.debug($.args);
};
cmd.any = new Command({
	//...
});

export default cmd;
```

## Error Handling
Any errors caused when using `await` or just regular synchronous functions will be automatically caught, you don't need to worry about those. However, promises must be caught manually. For example, `$.channel.send("")` will throw an error because you can't send empty messages to Discord, but since it's a promise, it'll just fade without throwing an error. There are two ways to do this:
- `$.channel.send("").catch($.handler.bind($))`
- `$.channel.send("").catch(error => $.handler(error))`

# The Common Library
This is the container of functions available without having to import `core/lib`, usually as `$`. When accessing this from a command's `run` function, it'll also come with shortcuts to other properties.

## Custom Wrappers
- `$(5)` = `new NumberWrapper(5)`
- `$("text")` = `new StringWrapper("text")`
- `$([1,2,3])` = `new ArrayWrapper([1,2,3])`

## Custom Logger
- `$.log(...)`
- `$.warn(...)`
- `$.error(...)`
- `$.debug(...)`
- `$.ready(...)` (only meant to be used once at the start of the program)

## Convenience Functions
This modularizes certain patterns of code to make things easier.
- `$.paginate()`: Takes a message and some additional parameters and makes a reaction page with it. All the pagination logic is taken care of but nothing more, the page index is returned and you have to send a callback to do something with it.
```js
const pages = ["one", "two", "three"];
const msg = await $.channel.send(pages[0]);

$.paginate(msg, $.author.id, pages.length, page => {
	msg.edit(pages[page]);
});
```
- `$.prompt()`: Prompts the user about a decision before following through.
```js
const msg = await $.channel.send("Are you sure you want to delete this?");

$.prompt(msg, $.author.id, () => {
	delete this; // Replace this with actual code.
});
```
- `$.getMemberByUsername()`: Gets a user by their username. Gets the first one then rolls with it.
- `$.callMemberByUsername()`: Convenience function to handle cases where someone isn't found by a username automatically.
```js
$.callMemberByUsername($.message, $.args.join(" "), member => {
	$.channel.send(`Your nickname is ${member.nickname}.`);
});
```

## Dynamic Properties
These will be accessible only inside a `Command` and will change per message.
- `$.args`: A list of arguments in the command. It's relative to the subcommand, so if you do `$test this 5`, `5` becomes `$.args[0]` if `this` is a subcommand. Args are already converted, so a `number` subcommand would return a number rather than a string.
- `$.client`: `message.client`
- `$.message`: `message`
- `$.channel`: `message.channel`
- `$.guild`: `message.guild`
- `$.author`: `message.author`
- `$.member`: `message.member`

# Wrappers
This is similar to modifying a primitive object's `prototype` without actually doing so.

## NumberWrapper
- `.pluralise()`: A substitute for not having to do `amount === 1 ? "singular" : "plural"`. For example, `$(x).pluralise("credit", "s")` will return `"1 credit"` and/or `"5 credits"` respectively.
- `.pluraliseSigned()`: This builds on `.pluralise()` and adds a sign at the beginning for marking changes/differences. `$(0).pluraliseSigned("credit", "s")` will return `"+0 credits"`.

## StringWrapper
- `.replaceAll()`: A non-regex alternative to replacing everything in a string. `$("test").replaceAll('t', 'z')` = `"zesz"`.
- `.toTitleCase()`: Capitalizes the first letter of each word. `$("this is some text").toTitleCase()` = `"This Is Some Text"`.

## ArrayWrapper
- `.random()`: Returns a random element from an array. `$([1,2,3]).random()` could be any one of those elements.
- `.split()`: Splits an array into different arrays by a specified length. `$([1,2,3,4,5,6,7,8,9,10]).split(3)` = `[[1,2,3],[4,5,6],[7,8,9],[10]]`.

# Other Library Functions
These do have to be manually imported, which are used more on a case-by-case basis.
- `formatTimestamp()`: Formats a `Date` object into your system's time. `YYYY-MM-DD HH:MM:SS`
- `formatUTCTimestamp()`: Formats a `Date` object into UTC time. `YYYY-MM-DD HH:MM:SS`
- `botHasPermission()`: Tests if a bot has a certain permission in a specified guild.
- `parseArgs()`: Turns `call test "args with spaces" "even more spaces"` into `["call", "test", "args with spaces", "even more spaces"]`, inspired by the command line.
- `parseVars()`: Replaces all `%` args in a string with stuff you specify. For example, you can replace all `nop` with `asm`, and `register %nop%` will turn into `register asm`. Useful for storing strings with variables in one place them accessing them in another place.
- `isType()`: Used for type-checking. Useful for testing `any` types.
- `select()`: Checks if a variable matches a certain type and uses the fallback value if not. (Warning: Type checking is based on the fallback's type. Be sure that the "type" parameter is accurate to this!)
- `Random`: An object of functions containing stuff related to randomness. `Random.num` is a random decimal, `Random.int` is a random integer, `Random.chance` takes a number ranging from `0` to `1` as a percentage. `Random.sign` takes a number and has a 50-50 chance to be negative or positive. `Random.deviation` takes a number and a magnitude and produces a random number within those confines. `(5, 2)` would produce any number between `3` and `7`.

# Other Core Functions
- `permissions::hasPermission()`: Checks if a `Member` has a certain permission.
- `permissions::getPermissionLevel()`: Gets a `Member`'s permission level according to the permissions enum defined in the file.
- `structures::getPrefix()`: Get the current prefix of the guild or the bot's prefix if none is found.

# The other core files
- `core/permissions`: Contains all the permission roles and checking functions.
- `core/structures`: Contains all the code handling dynamic JSON data. Has a one-to-one connection with each file generated, for example, `Config` which calls `super("config")` meaning it writes to `data/config.json`.
- `core/storage`: Handles most of the file system operations, all of the ones related to `data` at least.