import {Command, NamedCommand, CHANNEL_TYPE, getPermissionName, getCommandList, getCommandInfo} from "../../core";
import {requireAllCasesHandledFor} from "../../lib";

export default new NamedCommand({
    description: "Lists all commands. If a command is specified, their arguments are listed as well.",
    usage: "([command, [subcommand/type], ...])",
    aliases: ["h"],
    async run({message, channel, guild, author, member, client, args}) {
        const commands = await getCommandList();
        let output = `Legend: \`<type>\`, \`[list/of/stuff]\`, \`(optional)\`, \`(<optional type>)\`, \`([optional/list/...])\``;

        for (const [category, commandList] of commands) {
            output += `\n\n===[ ${category} ]===`;
            for (const command of commandList) output += `\n- \`${command.name}\`: ${command.description}`;
        }

        channel.send(output, {split: true});
    },
    any: new Command({
        async run({message, channel, guild, author, member, client, args}) {
            const [result, category] = await getCommandInfo(args);
            if (typeof result === "string") return channel.send(result);
            let append = "";
            const command = result.command;
            const header = result.args.length > 0 ? `${result.header} ${result.args.join(" ")}` : result.header;

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
