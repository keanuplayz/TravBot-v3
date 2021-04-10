import {
    Command,
    NamedCommand,
    CHANNEL_TYPE,
    getPermissionName,
    getCommandList,
    getCommandInfo,
    paginate
} from "../../core";
import {requireAllCasesHandledFor} from "../../lib";
import {MessageEmbed} from "discord.js";

const EMBED_COLOR = "#158a28";

export default new NamedCommand({
    description: "Lists all commands. If a command is specified, their arguments are listed as well.",
    usage: "([command, [subcommand/type], ...])",
    aliases: ["h"],
    async run({send, message, channel, guild, author, member, client, args}) {
        const commands = await getCommandList();
        const categoryArray = commands.keyArray();

        paginate(send, author.id, categoryArray.length, (page, hasMultiplePages) => {
            const category = categoryArray[page];
            const commandList = commands.get(category)!;
            let output = `Legend: \`<type>\`, \`[list/of/stuff]\`, \`(optional)\`, \`(<optional type>)\`, \`([optional/list/...])\`\n`;
            for (const command of commandList) output += `\n❯ \`${command.name}\`: ${command.description}`;
            return new MessageEmbed()
                .setTitle(hasMultiplePages ? `${category} (Page ${page + 1} of ${categoryArray.length})` : category)
                .setDescription(output)
                .setColor(EMBED_COLOR);
        });
    },
    any: new Command({
        async run({send, message, channel, guild, author, member, client, args}) {
            const [result, category] = await getCommandInfo(args);
            if (typeof result === "string") return send(result);
            let append = "";
            const command = result.command;
            const header = result.args.length > 0 ? `${result.header} ${result.args.join(" ")}` : result.header;

            if (command.usage === "") {
                const list: string[] = [];

                for (const [tag, subcommand] of result.keyedSubcommandInfo) {
                    const customUsage = subcommand.usage ? ` ${subcommand.usage}` : "";
                    list.push(`❯ \`${header} ${tag}${customUsage}\` - ${subcommand.description}`);
                }

                for (const [type, subcommand] of result.subcommandInfo) {
                    const customUsage = subcommand.usage ? ` ${subcommand.usage}` : "";
                    list.push(`❯ \`${header} ${type}${customUsage}\` - ${subcommand.description}`);
                }

                append = list.length > 0 ? list.join("\n") : "None";
            } else {
                append = `\`${header} ${command.usage}\``;
            }

            let aliases = "N/A";

            if (command instanceof NamedCommand) {
                const formattedAliases: string[] = [];
                for (const alias of command.aliases) formattedAliases.push(`\`${alias}\``);
                // Short circuit an empty string, in this case, if there are no aliases.
                aliases = formattedAliases.join(", ") || "None";
            }

            return send(
                new MessageEmbed()
                    .setTitle(header)
                    .setDescription(command.description)
                    .setColor(EMBED_COLOR)
                    .addFields(
                        {
                            name: "Aliases",
                            value: aliases,
                            inline: true
                        },
                        {
                            name: "Category",
                            value: category,
                            inline: true
                        },
                        {
                            name: "Permission Required",
                            value: `\`${getPermissionName(result.permission)}\` (Level ${result.permission})`,
                            inline: true
                        },
                        {
                            name: "Channel Type",
                            value: getChannelTypeName(result.channelType),
                            inline: true
                        },
                        {
                            name: "NSFW Only?",
                            value: result.nsfw ? "Yes" : "No",
                            inline: true
                        },
                        {
                            name: "Usages",
                            value: append
                        }
                    )
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
