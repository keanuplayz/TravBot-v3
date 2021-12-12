import {MessageAttachment, User} from "discord.js";
import {NamedCommand, Command, RestCommand, getUserByNickname} from "onion-lasers";
import petPetGif from "pet-pet-gif";

export default new NamedCommand({
    description: "Generates a pat GIF of the provided attachment image OR the avatar of the mentioned user.",
    usage: "(@user)",
    async run({message, send, author}) {
        if (message.attachments.size !== 0) {
            const attachment = message.attachments.first()!;
            const gif = await petPetGif(attachment.url);
            const file = new MessageAttachment(gif, "pat.gif");
            send({files: [file]});
        } else {
            const gif = await petPetGif(author.displayAvatarURL({format: "png"}));
            const file = new MessageAttachment(gif, "pat.gif");
            send({files: [file]});
        }
    },
    id: "user",
    user: new Command({
        description: "User to generate a GIF of.",
        async run({send, args}) {
            const user: User = args[0];
            const gif = await petPetGif(user.displayAvatarURL({format: "png"}));
            const file = new MessageAttachment(gif, "pat.gif");
            send({files: [file]});
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
                send({files: [file]});
            }
        }
    })
});
