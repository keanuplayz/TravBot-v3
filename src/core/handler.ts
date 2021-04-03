import {client} from "../index";
import {loadableCommands} from "./loader";
import {Permissions, Message} from "discord.js";
import {getPrefix} from "./structures";
import {Config} from "./structures";

// For custom message events that want to cancel the command handler on certain conditions.
const interceptRules: ((message: Message) => boolean)[] = [(message) => message.author.bot];

export function addInterceptRule(handler: (message: Message) => boolean) {
    interceptRules.push(handler);
}

// Note: client.user is only undefined before the bot logs in, so by this point, client.user cannot be undefined.
client.on("message", async (message) => {
    for (const shouldIntercept of interceptRules) {
        if (shouldIntercept(message)) {
            return;
        }
    }

    // Continue if the bot has permission to send messages in this channel.
    if (
        message.channel.type === "dm" ||
        message.channel.permissionsFor(client.user!)!.has(Permissions.FLAGS.SEND_MESSAGES)
    ) {
        const text = message.content;
        const prefix = getPrefix(message.guild);

        // First, test if the message is just a ping to the bot.
        if (new RegExp(`^<@!?${client.user!.id}>$`).test(text)) {
            message.channel.send(`${message.author}, my prefix on this guild is \`${prefix}\`.`);
        }
        // Then check if it's a normal command.
        else if (text.startsWith(prefix)) {
            const [header, ...args] = text.substring(prefix.length).split(/ +/);
            const commands = await loadableCommands;

            if (commands.has(header)) {
                const command = commands.get(header)!;

                // Send the arguments to the command to resolve and execute.
                // TMP[MAKE SURE TO REPLACE WITH command.execute WHEN FINISHED]
                const result = await command.actualExecute(args, {
                    author: message.author,
                    channel: message.channel,
                    client: message.client,
                    guild: message.guild,
                    member: message.member,
                    message: message
                });

                // If something went wrong, let the user know (like if they don't have permission to use a command).
                if (result) {
                    message.channel.send(result);
                }
            }
        }
    } else {
        message.author.send(
            `I don't have permission to send messages in ${message.channel}. ${
                message.member!.hasPermission(Permissions.FLAGS.ADMINISTRATOR)
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
