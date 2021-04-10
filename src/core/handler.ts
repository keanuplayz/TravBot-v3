import {Client, Permissions, Message, TextChannel, DMChannel, NewsChannel} from "discord.js";
import {getPrefix, loadableCommands} from "./interface";

// For custom message events that want to cancel the command handler on certain conditions.
const interceptRules: ((message: Message) => boolean)[] = [(message) => message.author.bot];

export function addInterceptRule(handler: (message: Message) => boolean) {
    interceptRules.push(handler);
}

const lastCommandInfo: {
    header: string;
    args: string[];
    channel: TextChannel | DMChannel | NewsChannel | null;
} = {
    header: "N/A",
    args: [],
    channel: null
};

const defaultMetadata = {
    permission: 0,
    nsfw: false,
    channelType: 0 // CHANNEL_TYPE.ANY, apparently isn't initialized at this point yet
};

// Note: client.user is only undefined before the bot logs in, so by this point, client.user cannot be undefined.
// Note: guild.available will never need to be checked because the message starts in either a DM channel or an already-available guild.
export function attachMessageHandlerToClient(client: Client) {
    client.on("message", async (message) => {
        for (const shouldIntercept of interceptRules) {
            if (shouldIntercept(message)) {
                return;
            }
        }

        const commands = await loadableCommands;
        const {author, channel, content, guild, member} = message;
        const send = channel.send.bind(channel);
        const text = content;
        const menu = {
            author,
            channel,
            client,
            guild,
            member,
            message,
            args: [],
            send
        };

        // Execute a dedicated block for messages in DM channels.
        if (channel.type === "dm") {
            // In a DM channel, simply forget about the prefix and execute any message as a command.
            const [header, ...args] = text.split(/ +/);

            if (commands.has(header)) {
                const command = commands.get(header)!;

                // Set last command info in case of unhandled rejections.
                lastCommandInfo.header = header;
                lastCommandInfo.args = [...args];
                lastCommandInfo.channel = channel;

                // Send the arguments to the command to resolve and execute.
                const result = await command.execute(args, menu, {
                    header,
                    args: [...args],
                    ...defaultMetadata,
                    symbolicArgs: []
                });

                // If something went wrong, let the user know (like if they don't have permission to use a command).
                if (result) {
                    send(result);
                }
            } else {
                send(
                    `I couldn't find the command or alias that starts with \`${header}\`. To see the list of commands, type \`help\``
                );
            }
        }
        // Continue if the bot has permission to send messages in this channel.
        else if (channel.permissionsFor(client.user!)!.has(Permissions.FLAGS.SEND_MESSAGES)) {
            const prefix = getPrefix(guild);

            // First, test if the message is just a ping to the bot.
            if (new RegExp(`^<@!?${client.user!.id}>$`).test(text)) {
                send(`${author}, my prefix on this server is \`${prefix}\`.`);
            }
            // Then check if it's a normal command.
            else if (text.startsWith(prefix)) {
                const [header, ...args] = text.substring(prefix.length).split(/ +/);

                if (commands.has(header)) {
                    const command = commands.get(header)!;

                    // Set last command info in case of unhandled rejections.
                    lastCommandInfo.header = header;
                    lastCommandInfo.args = [...args];
                    lastCommandInfo.channel = channel;

                    // Send the arguments to the command to resolve and execute.
                    const result = await command.execute(args, menu, {
                        header,
                        args: [...args],
                        ...defaultMetadata,
                        symbolicArgs: []
                    });

                    // If something went wrong, let the user know (like if they don't have permission to use a command).
                    if (result) {
                        send(result);
                    }
                }
            }
        }
        // Otherwise, let the sender know that the bot doesn't have permission to send messages.
        else {
            author.send(
                `I don't have permission to send messages in ${channel}. ${
                    member!.hasPermission(Permissions.FLAGS.ADMINISTRATOR)
                        ? "Because you're a server admin, you have the ability to change that channel's permissions to match if that's what you intended."
                        : "Try using a different channel or contacting a server admin to change permissions of that channel if you think something's wrong."
                }`
            );
        }
    });
}

process.on("unhandledRejection", (reason: any) => {
    if (reason?.name === "DiscordAPIError") {
        console.error(`Command Error: ${lastCommandInfo.header} (${lastCommandInfo.args.join(", ")})\n${reason.stack}`);
        lastCommandInfo.channel?.send(
            `There was an error while trying to execute that command!\`\`\`${reason.stack}\`\`\``
        );
    }
});
