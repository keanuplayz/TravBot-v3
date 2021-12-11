import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {NamedCommand, CHANNEL_TYPE} from "onion-lasers";

export const header = new SlashCommandBuilder().setDescription("Chooses someone to love.");
export async function handler(interaction: CommandInteraction) {
    const member = interaction.guild!.members.cache.random();
    if (!member) return interaction.reply("For some reason, an error occurred fetching a member.");
    return interaction.reply(`I love ${member.nickname ?? member.user.username}!`);
}
export default new NamedCommand({
    description: "Chooses someone to love.",
    channelType: CHANNEL_TYPE.GUILD,
    async run({send, guild}) {
        const member = guild!.members.cache.random();
        if (!member) return send("For some reason, an error occurred fetching a member.");
        return send(`I love ${member.nickname ?? member.user.username}!`);
    }
});
