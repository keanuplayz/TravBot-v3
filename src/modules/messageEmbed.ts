import {client} from "../index";
import {MessageEmbed} from "discord.js";
import {getPrefix} from "../structures";
import {getMessageByID} from "onion-lasers";

client.on("message", async (message) => {
    // Only execute if the message is from a user and isn't a command.
    if (message.content.startsWith(getPrefix(message.guild)) || message.author.bot) return;
    const messageLink = extractFirstMessageLink(message.content);
    if (!messageLink) return;
    const [guildID, channelID, messageID] = messageLink;

    const linkMessage = await getMessageByID(channelID, messageID);

    // If it's an invalid link (or the bot doesn't have access to it).
    if (typeof linkMessage === "string") {
        return message.channel.send("I don't have access to that channel!");
    }

    const embeds = [
        ...linkMessage.embeds.filter((embed) => embed.type === "rich"),
        ...linkMessage.attachments.values()
    ];

    if (!linkMessage.cleanContent && embeds.length === 0) {
        return message.channel.send(new MessageEmbed().setDescription("🚫 The message is empty."));
    }

    const infoEmbed = new MessageEmbed()
        .setAuthor(
            linkMessage.author.username,
            linkMessage.author.displayAvatarURL({format: "png", dynamic: true, size: 4096})
        )
        .setTimestamp(linkMessage.createdTimestamp)
        .setDescription(
            `${linkMessage.cleanContent}\n\nSent in **${linkMessage.guild?.name}** | <#${linkMessage.channel.id}> ([link](https://discord.com/channels/${guildID}/${channelID}/${messageID}))`
        );

    if (linkMessage.attachments.size !== 0) {
        const image = linkMessage.attachments.first();
        infoEmbed.setImage(image!.url);
    }

    return await message.channel.send(infoEmbed);
});

export function extractFirstMessageLink(message: string): [string, string, string] | null {
    const messageLinkMatch = message.match(
        /([!<])?https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/(\d{17,})\/(\d{17,})\/(\d{17,})(>)?/
    );
    if (messageLinkMatch === null) return null;
    const [, leftToken, guildID, channelID, messageID, rightToken] = messageLinkMatch;
    // "!link" and "<link>" will cancel the embed request.
    if (leftToken === "!" || (leftToken === "<" && rightToken === ">")) return null;
    else return [guildID, channelID, messageID];
}
