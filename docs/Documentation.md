# Table of Contents

...

# Structure

- `src`: Contains all the code for the bot itself. Code directly in this folder is for the starting index file as well as commonly accessed utility files.
	- `core`: This is currently where the command handler is. Try to keep it as isolated as possible, it might split off to become its own module.
	- `commands`: Where all the dynamically loaded commands are stored. You can use a subfolder to specify the command category. Specify a `modules` folder to create files that are ignored by the command loader.
	- `modules`: This is where mostly single-purpose blocks of code go. (This is **not** the same as a `modules` folder under `commands`.)
	- `defs`: Contains static definitions.
- `dist`: This is where the runnable code in `src` compiles to. (The directory structure mirrors `src`.)
- `data`: Holds all the dynamic/private data used by the bot. This folder is not meant to hold definitions.
- `docs`: Information for developers who want to contribute.

# Cleanup is Soon™

## Convenience Functions

This modularizes certain patterns of code to make things easier.

- `$.paginate()`: Takes a message and some additional parameters and makes a reaction page with it. All the pagination logic is taken care of but nothing more, the page index is returned and you have to send a callback to do something with it.

```js
const pages = ['one', 'two', 'three'];
const msg = await $.channel.send(pages[0]);

$.paginate(msg, $.author.id, pages.length, (page) => {
  msg.edit(pages[page]);
});
```

- `$.prompt()`: Prompts the user about a decision before following through.

```js
const msg = await $.channel.send('Are you sure you want to delete this?');

$.prompt(msg, $.author.id, () => {
  delete this; // Replace this with actual code.
});
```

- `$.getMemberByUsername()`: Gets a user by their username. Gets the first one then rolls with it.
- `$.callMemberByUsername()`: Convenience function to handle cases where someone isn't found by a username automatically.

```js
$.callMemberByUsername($.message, $.args.join(' '), (member) => {
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
