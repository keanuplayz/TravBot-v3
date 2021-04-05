import {client} from "../index";
import {loadableCommands} from "./loader";
import {Permissions, Message} from "discord.js";
import {getPrefix} from "./structures";
import {Config} from "./structures";
import {defaultMetadata} from "./command";

// For custom message events that want to cancel the command handler on certain conditions.
const interceptRules: ((message: Message) => boolean)[] = [(message) => message.author.bot];

export function addInterceptRule(handler: (message: Message) => boolean) {
    interceptRules.push(handler);
}

// Note: client.user is only undefined before the bot logs in, so by this point, client.user cannot be undefined.
// Note: guild.available will never need to be checked because the message starts in either a DM channel or an already-available guild.
client.on("message", async (message) => {
    for (const shouldIntercept of interceptRules) {
        if (shouldIntercept(message)) {
            return;
        }
    }

    const commands = await loadableCommands;
    const {author, channel, content, guild, member} = message;
    const text = content;
    const menu = {
        author,
        channel,
        client,
        guild,
        member,
        message,
        args: []
    };

    // Execute a dedicated block for messages in DM channels.
    if (channel.type === "dm") {
        // In a DM channel, simply forget about the prefix and execute any message as a command.
        const [header, ...args] = text.split(/ +/);

        if (commands.has(header)) {
            const command = commands.get(header)!;

            // Send the arguments to the command to resolve and execute.
            const result = await command.execute(args, menu, {
                header,
                args: [...args],
                ...defaultMetadata
            });

            // If something went wrong, let the user know (like if they don't have permission to use a command).
            if (result) {
                channel.send(result);
            }
        } else {
            channel.send(
                `I couldn't find the command or alias that starts with \`${header}\`. To see the list of commands, type \`help\``
            );
        }
    }
    // Continue if the bot has permission to send messages in this channel.
    else if (channel.permissionsFor(client.user!)!.has(Permissions.FLAGS.SEND_MESSAGES)) {
        const prefix = getPrefix(guild);

        // First, test if the message is just a ping to the bot.
        if (new RegExp(`^<@!?${client.user!.id}>$`).test(text)) {
            channel.send(`${author}, my prefix on this server is \`${prefix}\`.`);
        }
        // Then check if it's a normal command.
        else if (text.startsWith(prefix)) {
            const [header, ...args] = text.substring(prefix.length).split(/ +/);

            if (commands.has(header)) {
                const command = commands.get(header)!;

                // Send the arguments to the command to resolve and execute.
                const result = await command.execute(args, menu, {
                    header,
                    args: [...args],
                    ...defaultMetadata
                });

                // If something went wrong, let the user know (like if they don't have permission to use a command).
                if (result) {
                    channel.send(result);
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

client.once("ready", () => {
    if (client.user) {
        console.ready(`Logged in as ${client.user.tag}.`);
        client.user.setActivity({
            type: "LISTENING",
            name: `${Config.prefix}help`
        });
    }
});
