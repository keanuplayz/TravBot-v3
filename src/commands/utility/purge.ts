import {NamedCommand, getPermissionLevel, getPermissionName, hasPermission} from "onion-lasers";
import {DMChannel, Permissions} from "discord.js";

export default new NamedCommand({
    description:
        "Purges the bot's messages in either a guild channel (requiring the BOT_SUPPORT permission level) or a DM channel (no permission required). Limited to the last 100 messages.",
    async run({send, message, channel, guild, client, author, member}) {
        if (channel instanceof DMChannel) {
            const messages = await channel.messages.fetch({
                limit: 100
            });

            for (const message of messages.values()) {
                if (message.author.id === client.user!.id) {
                    message.delete();
                }
            }
        } else if (hasPermission(author, member, PERMISSIONS.BOT_SUPPORT)) {
            if (guild!.me?.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES)) message.delete();

            const messages = await channel.messages.fetch({
                limit: 100
            });
            const travMessages = messages.filter((msg) => msg.author.id === client.user!.id);

            send(`Found ${travMessages.size} messages to delete.`).then((msg) => msg.delete({timeout: 5000}));

            // It's better to go through the bot's own messages instead of calling bulkDelete which requires MANAGE_MESSAGES.
            for (const message of messages.values()) {
                if (message.author.id === client.user!.id) {
                    message.delete();
                }
            }
        } else {
            const userPermLevel = getPermissionLevel(author, member);
            send(
                `You don't have access to this command! Your permission level is \`${getPermissionName(
                    userPermLevel
                )}\` (${userPermLevel}), but this command requires a permission level of \`${getPermissionName(
                    PERMISSIONS.BOT_SUPPORT
                )}\` (${PERMISSIONS.BOT_SUPPORT}).`
            );
        }
    }
});
