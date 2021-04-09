import {Command, NamedCommand, loadableCommands, categories, getPermissionName, CHANNEL_TYPE} from "../../core";
import {toTitleCase, requireAllCasesHandledFor} from "../../lib";

export default new NamedCommand({
    description: "Lists all commands. If a command is specified, their arguments are listed as well.",
    usage: "([command, [subcommand/type], ...])",
    aliases: ["h"],
    async run({message, channel, guild, author, member, client, args}) {
        const commands = await loadableCommands;
        let output = `Legend: \`<type>\`, \`[list/of/stuff]\`, \`(optional)\`, \`(<optional type>)\`, \`([optional/list/...])\``;

        for (const [category, headers] of categories) {
            let tmp = `\n\n===[ ${toTitleCase(category)} ]===`;
            // Ignore empty categories, including ["test"].
            let hasActualCommands = false;

            for (const header of headers) {
                if (header !== "test") {
                    const command = commands.get(header)!;
                    tmp += `\n- \`${header}\`: ${command.description}`;
                    hasActualCommands = true;
                }
            }

            if (hasActualCommands) output += tmp;
        }

        channel.send(output, {split: true});
    },
    any: new Command({
        async run({message, channel, guild, author, member, client, args}) {
            // Setup the root command
            const commands = await loadableCommands;
            let header = args.shift() as string;
            let command = commands.get(header);
            if (!command || header === "test") return channel.send(`No command found by the name \`${header}\`.`);
            if (!(command instanceof NamedCommand))
                return channel.send(`Command is not a proper instance of NamedCommand.`);
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
            const result = await command.resolveInfo(args);

            if (result.type === "error") return channel.send(result.message);

            let append = "";
            command = result.command;

            if (result.args.length > 0) header += " " + result.args.join(" ");

            if (command.usage === "") {
                const list: string[] = [];

                for (const [tag, subcommand] of result.keyedSubcommandInfo) {
                    const customUsage = subcommand.usage ? ` ${subcommand.usage}` : "";
                    list.push(`- \`${header} ${tag}${customUsage}\` - ${subcommand.description}`);
                }

                for (const [type, subcommand] of result.subcommandInfo) {
                    const customUsage = subcommand.usage ? ` ${subcommand.usage}` : "";
                    list.push(`- \`${header} ${type}${customUsage}\` - ${subcommand.description}`);
                }

                append = "Usages:" + (list.length > 0 ? `\n${list.join("\n")}` : " None.");
            } else {
                append = `Usage: \`${header} ${command.usage}\``;
            }

            let aliases = "N/A";

            if (command instanceof NamedCommand) {
                const formattedAliases: string[] = [];
                for (const alias of command.aliases) formattedAliases.push(`\`${alias}\``);
                // Short circuit an empty string, in this case, if there are no aliases.
                aliases = formattedAliases.join(", ") || "None";
            }

            return channel.send(
                `Command: \`${header}\`\nAliases: ${aliases}\nCategory: \`${category}\`\nPermission Required: \`${getPermissionName(
                    result.permission
                )}\` (${result.permission})\nChannel Type: ${getChannelTypeName(result.channelType)}\nNSFW Only: ${
                    result.nsfw ? "Yes" : "No"
                }\nDescription: ${command.description}\n${append}`,
                {split: true}
            );
        }
    })
});

function getChannelTypeName(type: CHANNEL_TYPE): string {
    switch (type) {
        case CHANNEL_TYPE.ANY:
            return "Any";
        case CHANNEL_TYPE.GUILD:
            return "Guild Only";
        case CHANNEL_TYPE.DM:
            return "DM Only";
        default:
            requireAllCasesHandledFor(type);
    }
}
