import {createCanvas, loadImage, Canvas} from "canvas";
import {TextChannel, MessageAttachment} from "discord.js";
import {parseVars} from "../lib";
import {Storage} from "../structures";
import {client} from "../index";

function applyText(canvas: Canvas, text: string) {
    const ctx = canvas.getContext("2d");
    let fontSize = 70;

    do {
        ctx.font = `${(fontSize -= 10)}px sans-serif`;
    } while (ctx.measureText(text).width > canvas.width - 300);

    return ctx.font;
}

client.on("guildMemberAdd", async (member) => {
    const {welcomeType, welcomeChannel, welcomeMessage, autoRoles} = Storage.getGuild(member.guild.id);

    if (autoRoles) {
        member.roles.add(autoRoles);
    }

    if (welcomeChannel) {
        const channel = member.guild.channels.cache.get(welcomeChannel);

        if (channel && channel instanceof TextChannel) {
            if (welcomeType === "graphical") {
                const canvas = createCanvas(700, 250);
                const ctx = canvas.getContext("2d");
                const background = await loadImage(
                    "https://raw.githubusercontent.com/keanuplayz/TravBot/dev/assets/wallpaper.png"
                );
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

                ctx.strokeStyle = "#74037b";
                ctx.strokeRect(0, 0, canvas.width, canvas.height);

                ctx.font = "28px sans-serif";
                ctx.fillStyle = "#ffffff";
                ctx.fillText("Welcome to the server,", canvas.width / 2.5, canvas.height / 3.5);

                ctx.font = applyText(canvas, member.displayName);
                ctx.fillStyle = "#ffffff";
                ctx.fillText(`${member.displayName}!`, canvas.width / 2.5, canvas.height / 1.5);

                ctx.beginPath();
                ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();

                const avatarURL =
                    member.user.avatarURL({
                        dynamic: true,
                        size: 2048,
                        format: "png"
                    }) ?? member.user.defaultAvatarURL;
                const avatar = await loadImage(avatarURL);
                ctx.drawImage(avatar, 25, 25, 200, 200);

                const attachment = new MessageAttachment(canvas.toBuffer("image/png"), "welcome-image.png");
                channel.send({content: `Welcome \`${member.user.tag}\`!`, attachments: [attachment]});
            } else if (welcomeType === "text") {
                channel.send(
                    parseVars(
                        welcomeMessage || "Say hello to `%user%`, everyone! We all need a warm welcome sometimes :D",
                        {
                            user: member.user.tag
                        }
                    )
                );
            }
        } else {
            console.error("[modules/guildMemberAdd]", `"${welcomeChannel}" is not a valid text channel ID!`);
        }
    }
});
