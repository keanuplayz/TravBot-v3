import {Collection, CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import glob from "glob";
import path from "path";

export async function loadCommands(
    commandsDir: string
): Promise<
    [Collection<string, SlashCommandBuilder>, Collection<string, (interaction: CommandInteraction) => Promise<any>>]
> {
    // Add a trailing separator so that the reduced filename list will reliably cut off the starting part.
    // "C:/some/path/to/commands" --> "C:/some/path/to/commands/" (and likewise for \)
    commandsDir = path.normalize(commandsDir);
    if (!commandsDir.endsWith(path.sep)) commandsDir += path.sep;

    const headers = new Collection<string, SlashCommandBuilder>();
    const handlers = new Collection<string, () => Promise<any>>();
    const files = await globP(path.join(commandsDir, "**", "*.js")); // This stage filters out source maps (.js.map).
    // Because glob will use / regardless of platform, the following regex pattern can rely on / being the case.
    const filesClean = files.map((filename) => filename.substring(commandsDir.length));
    // Extract the usable parts from commands directory if the path is 1 to 2 subdirectories (a or a/b, not a/b/c).
    // No further checks will be made to exclude template command files or test command files, keeping it structure-agnostic.
    const pattern = /^([^/]+(?:\/[^/]+)?)\.js$/;

    for (let i = 0; i < files.length; i++) {
        const match = pattern.exec(filesClean[i]);
        if (!match) continue;
        const commandID = match[1]; // e.g. "utilities/info"
        const slashIndex = commandID.indexOf("/");
        const isMiscCommand = slashIndex !== -1;
        const commandName = isMiscCommand ? commandID.substring(slashIndex + 1) : commandID; // e.g. "info"

        // This try-catch block MUST be here or Node.js' dynamic require() will silently fail.
        try {
            // If the dynamic import works, it must be an object at the very least. Then, just test to see if it's a proper instance.
            const {header, handler} = (await import(files[i])) as {header: unknown; handler: unknown};

            if (header instanceof SlashCommandBuilder && handler instanceof Function) {
                if (headers.has(commandName) || handlers.has(commandName)) {
                    console.warn(
                        `Command "${commandID}" already exists! Make sure to make each command uniquely identifiable across categories!`
                    );
                } else {
                    // Set the slash command name to the filename only if there isn't already a name set
                    if (header.name === undefined) {
                        header.setName(commandName);
                    }

                    headers.set(header.name, header);
                    handlers.set(header.name, handler as any); // Just got to hope that the user puts in good data
                    console.log(`Loaded Command: "${commandID}" as "${header.name}"`); // Use header.name to show what the slash command name is (should be the same)
                }
            } else {
                console.warn(
                    `Command "${commandID}" doesn't export a "header" property (SlashCommandBuilder instance) or a "handler" property (function)!`
                );
            }
        } catch (error) {
            console.error(error);
        }
    }

    return [headers, handlers];
}

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
