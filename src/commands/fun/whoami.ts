import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {registry} from "./whois";

export const header = new SlashCommandBuilder().setDescription("Tells you who you are");

export function handler(interaction: CommandInteraction) {
    const {user} = interaction;
    const id = user.id;

    if (id in registry) {
        interaction.reply({content: `${user} ${registry[id]}`, allowedMentions: {parse: []}});
    } else {
        interaction.reply("You haven't been added to the registry yet!");
    }
}
