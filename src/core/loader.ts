import {Collection} from "discord.js";
import glob from "glob";
import {NamedCommand, CommandInfo} from "./command";
import {toTitleCase} from "../lib";

// Internally, it'll keep its original capitalization. It's up to you to convert it to title case when you make a help command.
const categories = new Collection<string, string[]>();

/** Returns the cache of the commands if it exists and searches the directory if not. */
export const loadableCommands = (async () => {
    const commands = new Collection<string, NamedCommand>();
    // Include all .ts files recursively in "src/commands/".
    const files = await globP("src/commands/**/*.ts");
    // Extract the usable parts from "src/commands/" if:
    // - The path is 1 to 2 subdirectories (a or a/b, not a/b/c)
    // - Any leading directory isn't "modules"
    // - The filename doesn't end in .test.ts (for jest testing)
    // - The filename cannot be the hardcoded top-level "template.ts", reserved for generating templates
    const pattern = /src\/commands\/(?!template\.ts)(?!modules\/)(\w+(?:\/\w+)?)(?:test\.)?\.ts/;
    const lists: {[category: string]: string[]} = {};

    for (const path of files) {
        const match = pattern.exec(path);

        if (match) {
            const commandID = match[1]; // e.g. "utilities/info"
            const slashIndex = commandID.indexOf("/");
            const isMiscCommand = slashIndex !== -1;
            const category = isMiscCommand ? commandID.substring(0, slashIndex) : "miscellaneous";
            const commandName = isMiscCommand ? commandID.substring(slashIndex + 1) : commandID; // e.g. "info"
            // If the dynamic import works, it must be an object at the very least. Then, just test to see if it's a proper instance.
            const command = (await import(`../commands/${commandID}`)).default as unknown;

            if (command instanceof NamedCommand) {
                command.name = commandName;

                if (commands.has(commandName)) {
                    console.warn(
                        `Command "${commandName}" already exists! Make sure to make each command uniquely identifiable across categories!`
                    );
                } else {
                    commands.set(commandName, command);
                }

                for (const alias of command.aliases) {
                    if (commands.has(alias)) {
                        console.warn(
                            `Top-level alias "${alias}" from command "${commandID}" already exists either as a command or alias!`
                        );
                    } else {
                        commands.set(alias, command);
                    }
                }

                if (!(category in lists)) lists[category] = [];
                lists[category].push(commandName);

                console.log(`Loading Command: ${commandID}`);
            } else {
                console.warn(`Command "${commandID}" has no default export which is a NamedCommand instance!`);
            }
        }
    }

    for (const category in lists) {
        categories.set(category, lists[category]);
    }

    return commands;
})();

function globP(path: string) {
    return new Promise<string[]>((resolve, reject) => {
        glob(path, (error, files) => {
            if (error) {
                reject(error);
            } else {
                resolve(files);
            }
        });
    });
}

/**
 * Returns a list of categories and their associated commands.
 */
export async function getCommandList(): Promise<Collection<string, NamedCommand[]>> {
    const list = new Collection<string, NamedCommand[]>();
    const commands = await loadableCommands;

    for (const [category, headers] of categories) {
        const commandList: NamedCommand[] = [];
        for (const header of headers.filter((header) => header !== "test")) commandList.push(commands.get(header)!);
        // Ignore empty categories like "miscellaneous" (if it's empty).
        if (commandList.length > 0) list.set(toTitleCase(category), commandList);
    }

    return list;
}

/**
 * Resolves a command based on the arguments given.
 * - Returns a string if there was an error.
 * - Returns a CommandInfo/category tuple if it was a success.
 */
export async function getCommandInfo(args: string[]): Promise<[CommandInfo, string] | string> {
    // Use getCommandList() instead if you're just getting the list of all commands.
    if (args.length === 0) return "No arguments were provided!";

    // Setup the root command
    const commands = await loadableCommands;
    let header = args.shift()!;
    const command = commands.get(header);
    if (!command || header === "test") return `No command found by the name \`${header}\`.`;
    if (!(command instanceof NamedCommand)) return "Command is not a proper instance of NamedCommand.";
    // If it's an alias, set the header to the original command name.
    if (command.name) header = command.name;

    // Search categories
    let category = "Unknown";
    for (const [referenceCategory, headers] of categories) {
        if (headers.includes(header)) {
            category = toTitleCase(referenceCategory);
            break;
        }
    }

    // Gather info
    const result = await command.resolveInfo(args, header);
    if (result.type === "error") return result.message;
    else return [result, category];
}
