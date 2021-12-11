import {MessageAttachment, User} from "discord.js";
import {NamedCommand, Command, RestCommand, getUserByNickname} from "onion-lasers";
import petPetGif from "pet-pet-gif";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";

//Ravioli ravioli...
//number from 1 to 9
export const header = new SlashCommandBuilder()
    .setDescription("Generates a pat GIF of the avatar of the mentioned user.")
    .addUserOption((option) => option.setName("user").setDescription("User you want a pat gif of.").setRequired(true));

export async function handler(interaction: CommandInteraction) {
    await interaction.reply("Generating pat gif...");
    const {options} = interaction;
    const pfp = options.getUser("user", true).displayAvatarURL({format: "png"});
    const gif = await petPetGif(pfp);
    const file = new MessageAttachment(gif, "pat.gif");
    await interaction.editReply({content: "Here you go!", files: [file]});
}

export default new NamedCommand({
    description: "Generates a pat GIF of the provided attachment image OR the avatar of the mentioned user.",
    usage: "(@user)",
    async run({message, send, author}) {
        if (message.attachments.size !== 0) {
            const attachment = message.attachments.first()!;
            const gif = await petPetGif(attachment.url);
            const file = new MessageAttachment(gif, "pat.gif");
            send({attachments: [file]});
        } else {
            const gif = await petPetGif(author.displayAvatarURL({format: "png"}));
            const file = new MessageAttachment(gif, "pat.gif");
            send({attachments: [file]});
        }
    },
    id: "user",
    user: new Command({
        description: "User to generate a GIF of.",
        async run({send, args}) {
            const user: User = args[0];
            const gif = await petPetGif(user.displayAvatarURL({format: "png"}));
            const file = new MessageAttachment(gif, "pat.gif");
            send({attachments: [file]});
        }
    }),
    any: new RestCommand({
        description: "User to generate a GIF of.",
        async run({send, combined, guild}) {
            const user = await getUserByNickname(combined, guild);

            if (typeof user === "string") send(user);
            else {
                const gif = await petPetGif(user.displayAvatarURL({format: "png"}));
                const file = new MessageAttachment(gif, "pat.gif");
                send({attachments: [file]});
            }
        }
    })
});
