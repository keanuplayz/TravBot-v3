import { client } from '..'
import { Message, TextChannel, APIMessage, MessageEmbed } from 'discord.js'
import { getPrefix } from '../core/structures'
import { DiscordAPIError } from 'discord.js'

export default async function quote(message: Message) {
    if (message.author.bot) return
    // const message_link_regex = message.content.match(/(!)?https?:\/\/\w+\.com\/channels\/(\d+)\/(\d+)\/(\d+)/)
    const message_link_regex = message.content.match(/([<!]?)https?:\/\/(?:ptb\.|canary\.|)discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)(>?)/)

    if (message_link_regex == null) return
    const [, char, guildID, channelID, messageID] = message_link_regex

    if (char || message.content.startsWith(getPrefix(message.guild))) return

    try {
        const channel = client.guilds.cache.get(guildID)?.channels.cache.get(channelID) as TextChannel
        const link_message = await channel.messages.fetch(messageID)

        let rtmsg: string | APIMessage = ''
        if (link_message.cleanContent) {
            rtmsg = new APIMessage(message.channel as TextChannel, {
                content: link_message.cleanContent,
                disableMentions: 'all',
                files: link_message.attachments.array()
            })
        }

        const embeds = [
            ...link_message.embeds.filter(v => v.type == 'rich'),
            ...link_message.attachments.values()
        ]

        /// @ts-ignore
        if (!link_message.cleanContent && embeds.empty) {
            const Embed = new MessageEmbed()
                .setDescription('🚫 The message is empty.')
            return message.channel.send(Embed)
        }

        const infoEmbed = new MessageEmbed()
            .setAuthor(
                link_message.author.username,
                link_message.author.displayAvatarURL({format: 'png', dynamic: true, size: 4096}))
            .setTimestamp(link_message.createdTimestamp)
            .setDescription(`${link_message.cleanContent}\n\nSent in **${link_message.guild?.name}** | <#${link_message.channel.id}> ([link](https://discord.com/channels/${guildID}/${channelID}/${messageID}))`);
            if (link_message.attachments.size !== 0) {
                const image = link_message.attachments.first();
                /// @ts-ignore
                infoEmbed.setImage(image.url);
            }

        await message.channel.send(infoEmbed)
    } catch (error) {
        if (error instanceof DiscordAPIError) {
            message.channel.send("I don't have access to this channel, or something else went wrong.")
        }
        return console.error(error)
    }
}