import Command from "../../core/command";
import {toTitleCase} from "../../core/lib";
import {loadableCommands, categories} from "../../core/loader";
import {getPermissionName} from "../../core/permissions";

export default new Command({
    description: "Lists all commands. If a command is specified, their arguments are listed as well.",
    usage: "([command, [subcommand/type], ...])",
    aliases: ["h"],
    async run($) {
        const commands = await loadableCommands;
        let output = `Legend: \`<type>\`, \`[list/of/stuff]\`, \`(optional)\`, \`(<optional type>)\`, \`([optional/list/...])\``;

        for (const [category, headers] of categories) {
            output += `\n\n===[ ${toTitleCase(category)} ]===`;

            for (const header of headers) {
                if (header !== "test") {
                    const command = commands.get(header);

                    if (!command)
                        return console.warn(
                            `Command "${header}" of category "${category}" unexpectedly doesn't exist!`
                        );

                    output += `\n- \`${header}\`: ${command.description}`;
                }
            }
        }

        $.channel.send(output, {split: true});
    },
    any: new Command({
        async run($) {
            // [category, commandName, command, subcommandInfo] = resolveCommandInfo();

            let append = "";

            if (usage === "") {
                const list: string[] = [];

                command.subcommands.forEach((subcmd, subtag) => {
                    // Don't capture duplicates generated from aliases.
                    if (subcmd.originalCommandName === subtag) {
                        const customUsage = subcmd.usage ? ` ${subcmd.usage}` : "";
                        list.push(`- \`${header} ${subtag}${customUsage}\` - ${subcmd.description}`);
                    }
                });

                const addDynamicType = (cmd: Command | null, type: string) => {
                    if (cmd) {
                        const customUsage = cmd.usage ? ` ${cmd.usage}` : "";
                        list.push(`- \`${header} <${type}>${customUsage}\` - ${cmd.description}`);
                    }
                };

                addDynamicType(command.user, "user");
                addDynamicType(command.number, "number");
                addDynamicType(command.any, "any");

                append = "Usages:" + (list.length > 0 ? `\n${list.join("\n")}` : " None.");
            } else append = `Usage: \`${header} ${usage}\``;

            const formattedAliases: string[] = [];
            for (const alias of command.aliases) formattedAliases.push(`\`${alias}\``);
            // Short circuit an empty string, in this case, if there are no aliases.
            const aliases = formattedAliases.join(", ") || "None";

            $.channel.send(
                `Command: \`${header}\`\nAliases: ${aliases}\nCategory: \`${selectedCategory}\`\nPermission Required: \`${getPermissionName(
                    permLevel
                )}\` (${permLevel})\nDescription: ${command.description}\n${append}`,
                {split: true}
            );
        }
    })
});
