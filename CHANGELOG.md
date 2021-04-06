# 2.8.4 - Reworked the react command
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

# 2.8.3 - The ultimate meme

# 2.8.2
- Added a changelog.
- Added an extra instruction to the readme's installation.
- Made commands utilize the existing `Array.random()` function.
- Removed concatenation when using template strings.
- Added `Number.pluralise()` for convenient pluralization.
- Reworked the `neko` command.
- Made `whoami` sync up with `whois` by using the same config.
- Fixed a bug with `emote` where it wouldn't find any upper case emotes and made it more lenient to just include any emote (so you don't have to remember the exact emote name).
- Moved lists and gathering shop items outside of `exports.run()` so that it initializes once during the bot's initialization (or when reloaded) rather than every time the command is called.

# 2.8.1 - Modularized eco shop and eco buy
- Fixed scanemotes sometimes not displaying all emotes. This was an issue of not accounting for whether an emote was animated or not.
- Modularized `eco shop` and `eco buy`. Shop items are now in the `shop` subfolder and `eco shop` now separates every 5 shop items into separate pages automatically.

# 2.8.0 - Added graphical welcome setting
- Adds a new option to the `set` and `conf` commands, allowing you to enable an image being sent as a welcome.

# 2.7.1 - Added eco buy laser bridge and reworked scanemotes
- `eco buy laser bridge` - Added a shop item. Buy what is technically a laser bridge. Costs 3 Mons.
- `insult` - Now pings the user who activated it.
- `scanemotes` - Reworked the command after a test run in a big server.
	- Merged the unsorted and sorted emote listings into one section. The unsorted emotes pretty much had a random order as it was pretty much which emote was added first as the search went on, so nothing's gone there. `#1 :emote: x 20 - 30.532% (Bots: 132)`
	- Bumped the cooldown from 1 hour to 1 day.
	- An updated progress meter which now stays on a single channel at a time because it's no longer asynchronous. This progress bar also works with Discord's rate limits. `Searching channel ___... (___ messages scanned, x/y channels scanned)`
	- Now includes all emotes in a server, even if they haven't been used.
	- Now properly counts emote usage for reactions (whether or not a bot reacted to a message)

# 2.7.0 - Added percentages to scanemotes
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

# 2.6.1 - Hotfix: Scan emotes no longer requires admin
- Fixed the `scanemotes` command to no longer require admin permissions. This was due to an oversight: There can be channels which the bot doesn't have access to, ie private channels. You have to check if the bot has access to a channel because the filter will gather all text-based channels regardless. Admin permissions overrides all restrictions, which is why it only worked with admin permissions.
- Entering a username in the `avatar` command unsuccessfully will now send a message in chat.

# 2.6.0 - Added the ability to get other users' avatars and see emote usage
- You can now scan the current guild for emote usage, collecting all emotes used in messages and reactions. (example below)
![2020-06-19 04_08_22-Window](https://user-images.githubusercontent.com/44940783/85116219-98a69280-b1e2-11ea-9246-b8f5ff2537ea.png)
- You can now get other avatars by providing an ID (works even when the bot doesn't share the same server as that user), username, or by pinging them.
- Included the fix for `serverinfo`.

# 2.5.3
- Changed default prefix for setup.
- Enhanced `react` command. New optional guildID arg.
- Added message logger.
- Fixed calc permission error.
- Removed `delete` command.
- Added ignored and notified channels to logger.
- Added images to logger. Added author to logger.
- Emote command is now not case-sensitive.

# 2.5.2 - Bug fixes to the "eco" command
- Now prevents users from sending negative amounts of money to others (minimum of 1 Mon).
- Also prevents users from sending decimal amounts.
- Fixes a potentially wrong substring for user IDs.
- Now requires an argument when using the "desc" command.

# 2.5.1
- Added shop functionality to eco.
- Fixed faulty guild check.
- Attempt at fixing emote for eco cute.
- Pluralised "mon" for eco handhold.
- Added `translate` command.

# 2.5.0 - Added the "pay" sub-command to "eco"

# 2.4.1
- Added Procfile.
- Updated whoami's keys.
- Rewrote `desc` command.

# 2.4.0 - Implemented music system
- VC Rename command
- Travis CI configuration
- Music system
- Dependency updates
