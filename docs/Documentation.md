# Table of Contents

- [Structure](#structure)
- [Version Numbers](#version-numbers)
- [Utility Functions](#utility-functions)
- [Testing](#testing)

# Structure

- `src`: Contains all the code for the bot itself. Code directly in this folder is for the starting index file as well as commonly accessed utility files.
	- `core`: This is currently where the command handler is. Try to keep it as isolated as possible, it might split off to become its own module.
	- `commands`: Where all the dynamically loaded commands are stored. You can use a subfolder to specify the command category. Specify a `modules` folder to create files that are ignored by the command loader.
	- `modules`: This is where mostly single-purpose blocks of code go. (This is **not** the same as a `modules` folder under `commands`.)
	- `defs`: Contains static definitions.
- `dist`: This is where the runnable code in `src` compiles to. (The directory structure mirrors `src`.)
- `data`: Holds all the dynamic/private data used by the bot. This folder is not meant to hold definitions.
- `docs`: Information for developers who want to contribute.

# Version Numbers

When a new version is ready to be declared...
- ...update the [changelog](../CHANGELOG.md).
- ...update the version numbers in [package.json](../package.json) and [package-lock.json](../package-lock.json).

## Naming Versions

Because versions are assigned to batches of changes rather than single changes (or even single commits), versioning is used a bit differently in order to avoid wasting version numbers.

`<prototype>.<major>.<minor>-<patch>`
- `<prototype>` is a defined as the overarching version group of TravBot. TravBot-v2 went by `2.x.x` and all versions of TravBot-v3 will go by `3.x.x`.
- `<major>` includes any big overhauls or revisions of the entire codebase.
- `<minor>` includes any feature additions in a specific area of the codebase.
- `<patch>` will be pretty much for any very small changes like a quick bug fix or typos. *Note: Normally, these would probably get grouped up, but if there hasn't been a proper version in a while, this will get pushed as a patch.*

*Note: This system doesn't retroactively apply to TravBot-v2, which is why this version naming system won't make sense for v2's changelog.*

# Utility Functions

## [src/lib](../src/lib.ts) - General utility functions

- `parseArgs()`: Turns `call test "args with spaces" "even more spaces"` into `["call", "test", "args with spaces", "even more spaces"]`, inspired by the command line.
- `parseVars()`: Replaces all `%` args in a string with stuff you specify. For example, you can replace all `nop` with `asm`, and `register %nop%` will turn into `register asm`. Useful for storing strings with variables in one place them accessing them in another place.
- `isType()`: Used for type-checking. Useful for testing `any` types.
- `select()`: Checks if a variable matches a certain type and uses the fallback value if not. (Warning: Type checking is based on the fallback's type. Be sure that the "type" parameter is accurate to this!)
- `Random`: An object of functions containing stuff related to randomness. `Random.num` is a random decimal, `Random.int` is a random integer, `Random.chance` takes a number ranging from `0` to `1` as a percentage. `Random.sign` takes a number and has a 50-50 chance to be negative or positive. `Random.deviation` takes a number and a magnitude and produces a random number within those confines. `(5, 2)` would produce any number between `3` and `7`.
- `pluralise()`: A substitute for not having to do `amount === 1 ? "singular" : "plural"`. For example, `pluralise(x, "credit", "s")` will return `"1 credit"` and/or `"5 credits"` respectively.
- `pluraliseSigned()`: This builds on `pluralise()` and adds a sign at the beginning for marking changes/differences. `pluraliseSigned(0, "credit", "s")` will return `"+0 credits"`.
- `replaceAll()`: A non-regex alternative to replacing everything in a string. `replaceAll("test", "t", "z")` = `"zesz"`.
- `toTitleCase()`: Capitalizes the first letter of each word. `toTitleCase("this is some text")` = `"This Is Some Text"`.
- `random()`: Returns a random element from an array. `random([1,2,3])` could be any one of those elements.
- `split()`: Splits an array into different arrays by a specified length. `split([1,2,3,4,5,6,7,8,9,10], 3)` = `[[1,2,3],[4,5,6],[7,8,9],[10]]`.

# Testing

For TravBot, there'll be two types of tests: standard unit tests and manual integration tests.
- Standard unit tests are executed only on isolated functions and are part of the pre-commit hook.
- Somehow, including the bot in an import chain will cause the system to crash (same error message as [this](https://stackoverflow.com/questions/66102858/discord-clientuser-is-not-a-constructor)). That's why the integration tests are manually done. There would be a list of inputs and outputs to check of each command for tests while simultaneously serving as a help menu with examples of all possible inputs/outputs for others to see.
- An idea which will not be implemented is prompting the user for inputs during the tests. This is no better than manual tests, worse actually, because if this had to run before each commit, it'd quickly become a nightmare.
- Maybe take some ideas from something like [this](https://github.com/stuyy/jest-unit-tests-demo) in the future to get tests to properly work.
- Another possibility is to use `client.emit(...)` then mock the `message.channel.send(...)` function which would listen if the input is correct.
