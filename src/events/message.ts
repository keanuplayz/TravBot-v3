import Event from "../core/event";
import Command, {loadableCommands} from "../core/command";
import {hasPermission, getPermissionLevel, PermissionNames} from "../core/permissions";
import {Permissions} from "discord.js";
import {getPrefix} from "../core/structures";
import {replyEventListeners} from "../core/libd";
import quote from "../modules/message_embed";

export default new Event<"message">({
    async on(message) {
        const commands = await loadableCommands;

        if (message.content.toLowerCase().includes("remember to drink water")) {
            message.react("🚱");
        }

        // Message Setup //
        if (message.author.bot) return;

        // If there's an inline reply, fire off that event listener (if it exists).
        if (message.reference) {
            const reference = message.reference;
            replyEventListeners.get(`${reference.channelID}-${reference.messageID}`)?.(message);
        }

        let prefix = getPrefix(message.guild);
        const originalPrefix = prefix;
        let exitEarly = !message.content.startsWith(prefix);
        const clientUser = message.client.user;
        let usesBotSpecificPrefix = false;

        if (!message.content.startsWith(prefix)) {
            return quote(message);
        }

        // If the client user exists, check if it starts with the bot-specific prefix.
        if (clientUser) {
            // If the prefix starts with the bot-specific prefix, go off that instead (these two options must mutually exclude each other).
            // The pattern here has an optional space at the end to capture that and make it not mess with the header and args.
            const matches = message.content.match(new RegExp(`^<@!?${clientUser.id}> ?`));

            if (matches) {
                prefix = matches[0];
                exitEarly = false;
                usesBotSpecificPrefix = true;
            }
        }

        // If it doesn't start with the current normal prefix or the bot-specific unique prefix, exit the thread of execution early.
        // Inline replies should still be captured here because if it doesn't exit early, two characters for a two-length prefix would still trigger commands.
        if (exitEarly) return;

        const [header, ...args] = message.content.substring(prefix.length).split(/ +/);

        // If the message is just the prefix itself, move onto this block.
        if (header === "" && args.length === 0) {
            // I moved the bot-specific prefix to a separate conditional block to separate the logic.
            // And because it listens for the mention as a prefix instead of a free-form mention, inline replies (probably) shouldn't ever trigger this unintentionally.
            if (usesBotSpecificPrefix) {
                message.channel.send(`${message.author.toString()}, my prefix on this guild is \`${originalPrefix}\`.`);
                return;
            }
        }

        if (!commands.has(header)) return;

        if (
            message.channel.type === "text" &&
            !message.channel.permissionsFor(message.client.user || "")?.has(Permissions.FLAGS.SEND_MESSAGES)
        ) {
            let status;

            if (message.member?.hasPermission(Permissions.FLAGS.ADMINISTRATOR))
                status =
                    "Because you're a server admin, you have the ability to change that channel's permissions to match if that's what you intended.";
            else
                status =
                    "Try using a different channel or contacting a server admin to change permissions of that channel if you think something's wrong.";

            return message.author.send(
                `I don't have permission to send messages in ${message.channel.toString()}. ${status}`
            );
        }

        console.log(
            `${message.author.username}#${message.author.discriminator} executed the command "${header}" with arguments "${args}".`
        );

        // Subcommand Recursion //
        let command = commands.get(header);
        if (!command) return console.warn(`Command "${header}" was called but for some reason it's still undefined!`);
        const params: any[] = [];
        let isEndpoint = false;
        let permLevel = command.permission ?? Command.PERMISSIONS.NONE;

        for (let param of args) {
            if (command.endpoint) {
                if (command.subcommands.size > 0 || command.user || command.number || command.any)
                    console.warn(`An endpoint cannot have subcommands! Check ${originalPrefix}${header} again.`);
                isEndpoint = true;
                break;
            }

            const type = command.resolve(param);
            command = command.get(param);
            permLevel = command.permission ?? permLevel;

            if (type === Command.TYPES.USER) {
                const id = param.match(/\d+/g)![0];
                try {
                    params.push(await message.client.users.fetch(id));
                } catch (error) {
                    return message.channel.send(`No user found by the ID \`${id}\`!`);
                }
            } else if (type === Command.TYPES.NUMBER) params.push(Number(param));
            else if (type !== Command.TYPES.SUBCOMMAND) params.push(param);
        }

        if (!message.member)
            return console.warn("This command was likely called from a DM channel meaning the member object is null.");

        if (!hasPermission(message.member, permLevel)) {
            const userPermLevel = getPermissionLevel(message.member);
            return message.channel.send(
                `You don't have access to this command! Your permission level is \`${PermissionNames[userPermLevel]}\` (${userPermLevel}), but this command requires a permission level of \`${PermissionNames[permLevel]}\` (${permLevel}).`
            );
        }

        if (isEndpoint) return message.channel.send("Too many arguments!");

        // Execute with dynamic library attached. //
        // The purpose of using $.bind($) is to clone the function so as to not modify the original $.
        // The cloned function doesn't copy the properties, so Object.assign() is used.
        // Object.assign() modifies the first element and returns that, the second element applies its properties and the third element applies its own overriding the second one.
        command.execute({
            args: params,
            author: message.author,
            channel: message.channel,
            client: message.client,
            guild: message.guild,
            member: message.member,
            message: message
        });
    }
});
