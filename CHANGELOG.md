# 3.2.2
- Moved command handler code to [Onion Lasers](https://github.com/WatDuhHekBro/OnionLasers)
- Reworked `poll`
- Extended stream notifications feature
- Fixed various bugs
- Improved searching for users by name

# 3.2.1
- `vaporwave`: Transforms input into full-width text
- `eco post`: A play on `eco get`
- `admin set prefix <prefix> (<@bot>)`: Allows you to target a bot when setting a prefix if two bots have conflicting prefixes
- `party`: Sets the bot's status to streaming with a certain URL
- `eco award`: Awards users with Mons, only accessible by that person
- `thonk`: A result can now be discarded if the person who called the command reacts with ❌
- `scanemotes forcereset`: Removes the cooldown on `scanemotes`, only accessible by bot support and up
- `urban`: Bug fixes
- Changed `help` to display a paginated embed
- Various changes to core
	- Added `guild` subcommand type (only accessible when `id: "guild"`)
	- Further reduced `channel.send()` to `send()` because it's used in *every, single, command*
	- Added a `RestCommand` type, declaratively states that the following command will do `args.join(" ")`, preventing any other subcommands from being added
	- Is no longer lenient to arguments when no proper subcommand fits (now it doesn't silently fail anymore), you now have to explicitly declare a `RestCommand` to get an arbitrary number of arguments

# 3.2.0 - Internal refactor, more subcommand types, and more command type guards (2021-04-09)
- The custom logger changed: `$.log` no longer exists, it's just `console.log`. Now you don't have to do `import $ from "../core/lib"` at the top of every file that uses the custom logger.
- Utility functions are no longer attached to the command menu. Stuff like `$.paginate()` and `$(5).pluralise()` instead need to be imported and used as regular functions.
- The `paginate` function was reworked to reduce the amount of repetition you had to do.
- Events are no longer loaded dynamically. What you do is `import "./some-file"` which will run the code in there, attaching the event to the client. Since events are no longer bound to certain files, you can keep them more organized:
	- Since there can be multiple listeners per event, large event files can be split up into more organized blocks.
	- You can also group together related events like `channelCreate` and `channelDelete` and show the relation in one single file rather than splitting them up just because they're two different events.
- Lots of files were moved around:
	- The `core` folder represents the command handler and is pretty much treated as if it was an external module. That means that instead of importing different items from each file, you'd import it from its index file (which is shortened to `import {} from ../core`). My hope is to move this section to its own module eventually™.
	- Other `core` files that were more or less specific to the bot were moved outside, either at the top-level or into `modules`. This includes stuff like the library file containing utility functions as well as structures for storing/loading data. Since they're at the top now, there's less typing involved in importing them (`../lib` instead of `../core/lib` and so on).
	- Commands are still dynamically loaded. This won't change.
- Added more type guards to the `Command` class, reducing the amount of unused properties there are.
	- If a command has `endpoint: true` specified, it'll now prevent adding subcommands at compile-time rather than relying on runtime warnings.
	- Added a `NamedCommand` subclass on top-level commands (default exports) as well as keyed subcommands (basically the ones with a hardcoded value). `NamedCommand`s have access to `aliases`. Having `aliases` on something like a numeric subcommand (ie `$test 5`) doesn't really make sense.
- Added more features to the `Command` class as well:
	- You can now restrict certain commands to Guild-only channels or DM-only channels. Unfortunately, there's a bug in TypeScript where callbacks don't get affected by discriminated unions. So for now, if you set a command's channel type, just do a non-null assertion on `guild` and a `TextChannel` assertion for `channel` (and vice versa).
	- A command can now be designated as NSFW-only.
	- Added more subcommand types:
		- Channel: `<#...>`
		- Role: `<@&...>`
		- Emote: `<a:some_name:ID>`
		- Message: `https://discordapp.com/channels/<Guild ID>/<Channel ID>/<Message ID>` or `<Channel ID>-<Message ID>` from the "Copy Message Link" and "Copy ID" (shift) buttons.
		- ID: Any Discord ID. In order to use this, you have to specify which subcommand type you want to redirect it to. For example, to replicate the old behavior with plain IDs being converted to user IDs, you first implement user `user: new Command(...)` then do `id: "user"`.
	- Some changes to subcommands:
		- User: `<@...>` and `<@!...>` - Its default state is more restricted. It no longer accepts standalone IDs by default.
- You'll notice in a lot of commands as well as the template that properties are destructured. While using `$` will work just fine, having `{message, channel, guild}` will let you access properties using `channel` instead of `$.channel` and so on.
- Direct messaging the bot now listens for commands. You don't need a prefix when doing this, it's assumed you're running a command.
- Command invocations are no longer logged every single time. Now the catch block shows the command used and the arguments, and unhandled rejections related to Discord are captured too, showing the same information.
- I added Husky and I think I've got its pre-commit hook to work. If this goes as expected, the formatter should be called every commit so there aren't any more formatting commits.
- Internally, the core message handler and the `Command` class(es) are very de-spaghettified compared to before. Its methods are a lot more modular now.
- Retroactively added version history for TravBot-v3.
- Revised documentation.

# 3.1.10 (2021-04-06)
- Ported the rest of features from TravBot-v2
- Prototyped stream notifications
- Added eco bet command
- Added several entries to the `whois` list
- Added functionality for reacting to in-line replies

# 3.1.9 (2021-03-28)
- Stops deleting the `emote` invocation
- Added channel lock for `eco`
- Listens for CheeseBot's "Remember to drink water!" message and reacts with 🚱
- Added message quoting
- Added sandboxed regex query to `lsemotes` with timeout
- Added `info guild` for other guilds

# 3.1.8 - Introduce a terrible hack to reduce memory usage and a few other less significant changes (2021-02-16)
- Add the titular hack™️ aka "pulling CC modding on discord.js".
- Reduce the usage of caches where possible (don't remember whether I eliminated all of them or not; note that guild members, roles and emojis can be assumed to be always cached if the guild object is available), especially in the info command (because I have effectively broken the automatic members cache with the titular hack). Also get rid of calls to `BaseManager#resolve` to make cache lookups explicit.
- Get rid of usages of `@ts-ignore` (never do this, or I'll kill you!!!).
- Enable sourcemaps for seeing the source code lines in the error stack traces.
- Raise the target JS edition to ES2019 since Node.js installed on the deployment machine is version 15.x anyway.

# 3.1.7 - Added time command for user-submitted timezones (2021-01-25)

# 3.1.6 - Added emote dumper (2021-01-03)

# 3.1.5 - Attempting to fix the emote name resolution (2020-12-20)
This is an attempt at fixing some notable problems with the `emote` and `react` commands, including the following:
- `leaSMUG` would resolve to `leaSmug` (should be fixed by taking capitalization into account and making an offset number from each difference)
- `leaCheese` would resolve to `leaCheeseAngry` (should be fixed by taking length into account in its heuristics)

# 3.1.4 - New formatter settings, hotfix, and feature (2020-12-16)
- Added `eco monday`
- Fixed `eval` command
- Ported `eco guild`
- Added more message linking options to `react`
- Added formatter
- Fixed error prevention in `neko` command

# 3.1.3 - Ported the eco command (2020-12-15)
- Ported the `eco` command, as well as `eco shop` and `eco buy`
- Public Rollout

# 3.1.2 - Added music functionality and ported more commands (2020-10-24)
- Added music functionality via Lavalink
- Ported the following commands:
	- `lsemotes`
	- `shorten`
	- `eval`
	- `info bot`
	- `admin clear`
	- `cookie`
	- `neko`
	- `ok`
	- `owoify`
	- `desc`
	- `react`
	- `say`
- Bug fixes to `info guild`

# 3.1.1 - Began the porting process (2020-09-11)
- Ported the following commands:
	- `info`
	- `8ball`
	- `poll`
	- `lsemotes`
	- `scanemotes`
- Ported the following commands to `admin`:
	- `status`
	- `purge`
	- `nick`
	- `guilds`
	- `activity`
- Added pinging bot for prefix and var string prefix
- Added removing emotes in paginate if possible
- Added command aliases
- Added CodeQL
- Modularized finding members by their username
- Added documentation
- Added Docker support

# 3.1.0 - Restructured the project according to CrossExchange (2020-07-26)
Ported over CrossExchange v1.0.1 and added several additional features:
- Command Categories: This follows suit of [the pre-rework command structure](https://github.com/keanuplayz/TravBot-v3/tree/pre-typescript/src/Commands), where you have categories (now `utility` which gets capitalized to `Utility` for example) and miscellaneous commands.
	- `subcommands` will be a reserved directory name to allow you to split up big command files into smaller ones. `commands/subcommands` is ignored as does `commands/utility/subcommands`.
	- The way you'd work with splitting up these commands is that instead of doing `export default new Command(...)`, you would instead do:
		- `subcommands/part1.ts`: `export default new Command(...)`
		- `main.ts`: `import sub from "./subcommands/part1"; const a = new Command(...); a.attach("layer", sub); export default a;`
- Command Permissions: These permissions will work with the recursive structure as well because it'd be useful to section off different subcommands into different permissions. For example, everyone has access to `.money` but if you want to add `.money set <user> <amount>` (better for organization), you'd simply assign a property to `.money set` and it'd affect everything below it unless overridden. See `admin.ts` for an example on how this works.
- Dynamically-Loaded Events: All events now read from the `events` folder. If you want to access the client, you can do so by importing it from the index. (`import {client} from "../index";`)

# 3.0.0 - Brainstormed first structure (2020-07-08)
- Adds folder-separated command categories.
- Adding commands now involves instantiating classes rather than exporting a function with some settings.
- Adds structures for better organization of commonly used classes like `Command` and `Event`.

# 2.8.4 - Reworked the react command (2020-09-05)
- `react` is now a fully versatile command for helping you react to other messages with non-server emotes.
	- Now properly reacts to the previous message (bug fix).
	- Provides you the option to react to any number of messages before your message (3 messages above yours for example).
	- Renamed guild ID to message ID for clarity's sake.
	- Now removes the bot's own reaction after a few seconds to make the reaction count more accurate.
	- Now lets you react with multiple messages in a row.
	- Now reacts with ❓ if no reactions were found at all (see below).
- `emote`:
	- Is now case-sensitive again (because there are too many name conflicts).
	- Accepts multiple emotes for tiled emotes.
	- Now reacts to your message with ❓ instead of `None of those emote names were valid!` so that the bot doesn't spam the chat if you can't find the right emote (because you'll still be able to delete your messages).
- `thonk` now stores the last specified phrase so you can repeat a phrase with different diacritics.

# 2.8.3 - The ultimate meme (2020-08-08)

# 2.8.2 (2020-07-01)
- Added a changelog.
- Added an extra instruction to the readme's installation.
- Made commands utilize the existing `Array.random()` function.
- Removed concatenation when using template strings.
- Added `Number.pluralise()` for convenient pluralization.
- Reworked the `neko` command.
- Made `whoami` sync up with `whois` by using the same config.
- Fixed a bug with `emote` where it wouldn't find any upper case emotes and made it more lenient to just include any emote (so you don't have to remember the exact emote name).
- Moved lists and gathering shop items outside of `exports.run()` so that it initializes once during the bot's initialization (or when reloaded) rather than every time the command is called.

# 2.8.1 - Modularized eco shop and eco buy (2020-06-30)
- Fixed scanemotes sometimes not displaying all emotes. This was an issue of not accounting for whether an emote was animated or not.
- Modularized `eco shop` and `eco buy`. Shop items are now in the `shop` subfolder and `eco shop` now separates every 5 shop items into separate pages automatically.

# 2.8.0 - Added graphical welcome setting (2020-06-29)
- Adds a new option to the `set` and `conf` commands, allowing you to enable an image being sent as a welcome.

# 2.7.1 - Added eco buy laser bridge and reworked scanemotes (2020-06-28)
- `eco buy laser bridge` - Added a shop item. Buy what is technically a laser bridge. Costs 3 Mons.
- `insult` - Now pings the user who activated it.
- `scanemotes` - Reworked the command after a test run in a big server.
	- Merged the unsorted and sorted emote listings into one section. The unsorted emotes pretty much had a random order as it was pretty much which emote was added first as the search went on, so nothing's gone there. `#1 :emote: x 20 - 30.532% (Bots: 132)`
	- Bumped the cooldown from 1 hour to 1 day.
	- An updated progress meter which now stays on a single channel at a time because it's no longer asynchronous. This progress bar also works with Discord's rate limits. `Searching channel ___... (___ messages scanned, x/y channels scanned)`
	- Now includes all emotes in a server, even if they haven't been used.
	- Now properly counts emote usage for reactions (whether or not a bot reacted to a message)

# 2.7.0 - Added percentages to scanemotes (2020-06-26)
## Major Changes
- Added an hour long cooldown to `scanemotes` per server because it's a very memory-intensive task to search through every single message.
- Added a second list of emotes to `scanemotes`, sorting by percentage of users-only usage.
- Added a function to the client's common functions to generate a page users can turn.
## Minor Changes
- `avatar`
	- Now has proper error handling when searching by mention and ID.
	- No longer pings the user, it just sends the image link by itself.
- `eco`
	- Merges `sender.id + message.guild.id` into `compositeID` since it's so frequently used.
	- Bug Fix: If you have exactly 1 Mon and you pay someone 1 Mon, they'll get 1 more Mon and you'll still have 1 Mon because the 0 coerces to false resetting your money, because JS soft comparison. Fixed by using the "in" operator instead.
	- Uses else ifs to make the command marginally faster.
	- Now properly handles mentions and extracting the user ID from them in the `pay` subcommand.
	- Added a message that occurs when the user tries to buy an item that doesn't exist.
- Added an `insult` command which will have the bot type out the navy seals copypasta for a minute.
- Modified the `invite` command to auto-generate a link based on the current bot client ID rather than having it be hardcoded to TravBot specifically.
- Added error checking to `scanemotes` so users aren't left in the dark if something happens.
- On big servers, `scanemotes` should now have emotes actually show up.

# 2.6.1 - Hotfix: Scan emotes no longer requires admin (2020-06-22)
- Fixed the `scanemotes` command to no longer require admin permissions. This was due to an oversight: There can be channels which the bot doesn't have access to, ie private channels. You have to check if the bot has access to a channel because the filter will gather all text-based channels regardless. Admin permissions overrides all restrictions, which is why it only worked with admin permissions.
- Entering a username in the `avatar` command unsuccessfully will now send a message in chat.

# 2.6.0 - Added the ability to get other users' avatars and see emote usage (2020-06-19)
- You can now scan the current guild for emote usage, collecting all emotes used in messages and reactions. (example below)
![2020-06-19 04_08_22-Window](https://user-images.githubusercontent.com/44940783/85116219-98a69280-b1e2-11ea-9246-b8f5ff2537ea.png)
- You can now get other avatars by providing an ID (works even when the bot doesn't share the same server as that user), username, or by pinging them.
- Included the fix for `serverinfo`.

# 2.5.3 (2020-06-16)
- Changed default prefix for setup.
- Enhanced `react` command. New optional guildID arg.
- Added message logger.
- Fixed calc permission error.
- Removed `delete` command.
- Added ignored and notified channels to logger.
- Added images to logger. Added author to logger.
- Emote command is now not case-sensitive.

# 2.5.2 - Bug fixes to the "eco" command (2020-06-01)
- Now prevents users from sending negative amounts of money to others (minimum of 1 Mon).
- Also prevents users from sending decimal amounts.
- Fixes a potentially wrong substring for user IDs.
- Now requires an argument when using the "desc" command.

# 2.5.1 (2020-05-18)
- Added shop functionality to eco.
- Fixed faulty guild check.
- Attempt at fixing emote for eco cute.
- Pluralised "mon" for eco handhold.
- Added `translate` command.

# 2.5.0 - Added the "pay" sub-command to "eco" (2020-05-09)

# 2.4.1 (2020-04-18)
- Added Procfile.
- Updated whoami's keys.
- Rewrote `desc` command.

# 2.4.0 - Implemented music system (2020-04-11)
- VC Rename command
- Travis CI configuration
- Music system
- Dependency updates
