import {client} from "../index";
import {loadableCommands} from "./loader";
import {Permissions, Message} from "discord.js";
import {getPrefix} from "./structures";
import {Config} from "./structures";
import {CHANNEL_TYPE} from "./command";

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

    const {author, channel, content, guild, member} = message;

    // Continue if the bot has permission to send messages in this channel.
    if (channel.type === "dm" || channel.permissionsFor(client.user!)!.has(Permissions.FLAGS.SEND_MESSAGES)) {
        const text = content;
        const prefix = getPrefix(guild);

        // First, test if the message is just a ping to the bot.
        if (new RegExp(`^<@!?${client.user!.id}>$`).test(text)) {
            channel.send(`${author}, my prefix on this guild is \`${prefix}\`.`);
        }
        // Then check if it's a normal command.
        else if (text.startsWith(prefix)) {
            const [header, ...args] = text.substring(prefix.length).split(/ +/);
            const commands = await loadableCommands;

            if (commands.has(header)) {
                const command = commands.get(header)!;

                // Send the arguments to the command to resolve and execute.
                // TMP[MAKE SURE TO REPLACE WITH command.execute WHEN FINISHED]
                const result = await command.execute(
                    args,
                    {
                        author,
                        channel,
                        client,
                        guild,
                        member,
                        message,
                        args: []
                    },
                    {
                        header,
                        args,
                        permission: 0,
                        nsfw: false,
                        channelType: CHANNEL_TYPE.ANY
                    }
                );

                // If something went wrong, let the user know (like if they don't have permission to use a command).
                if (result) {
                    channel.send(result);
                }
            }
        }
    } else {
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
