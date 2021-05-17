import {MessageAttachment, User} from "discord.js";
import {NamedCommand, Command} from "onion-lasers";
import petPetGif from "pet-pet-gif";

export default new NamedCommand({
    description: "Generates a pat GIF of the provided attachment image OR the avatar of the mentioned user.",
    usage: "(@user)",
    async run({message, send, author}) {
        if (message.attachments.size !== 0) {
            const attachment = message.attachments.first()!;
            const gif = await petPetGif(attachment.url);
            const file = new MessageAttachment(gif, "pat.gif");
            send(file);
        } else {
            const gif = await petPetGif(author.displayAvatarURL({format: "png"}));
            const file = new MessageAttachment(gif, "pat.gif");
            send(file);
        }
    },
    id: "user",
    user: new Command({
        description: "User to generate a GIF of.",
        async run({send, args}) {
            const user: User = args[0];
            const gif = await petPetGif(user.displayAvatarURL({format: "png"}));
            const file = new MessageAttachment(gif, "pat.gif");
            send(file);
        }
    })
});
