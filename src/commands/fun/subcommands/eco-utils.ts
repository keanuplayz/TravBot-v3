import $ from "../../../core/lib";
import {Storage} from "../../../core/structures";
import {User, Guild, TextChannel, DMChannel, NewsChannel} from "discord.js";

export const ECO_EMBED_COLOR = 0xf1c40f;

export function getMoneyEmbed(user: User): object {
    const profile = Storage.getUser(user.id);

    return {
        embed: {
            color: ECO_EMBED_COLOR,
            author: {
                name: user.username,
                icon_url: user.displayAvatarURL({
                    format: "png",
                    dynamic: true
                })
            },
            fields: [
                {
                    name: "Balance",
                    value: $(profile.money).pluralise("Mon", "s")
                }
            ]
        }
    };
}

export function getSendEmbed(sender: User, receiver: User, amount: number): object {
    return {
        embed: {
            color: ECO_EMBED_COLOR,
            author: {
                name: sender.username,
                icon_url: sender.displayAvatarURL({
                    format: "png",
                    dynamic: true
                })
            },
            title: "Transaction",
            description: `${sender.toString()} has sent ${$(amount).pluralise("Mon", "s")} to ${receiver.toString()}!`,
            fields: [
                {
                    name: `Sender: ${sender.username}#${sender.discriminator}`,
                    value: $(Storage.getUser(sender.id).money).pluralise("Mon", "s")
                },
                {
                    name: `Receiver: ${receiver.username}#${receiver.discriminator}`,
                    value: $(Storage.getUser(receiver.id).money).pluralise("Mon", "s")
                }
            ],
            footer: {
                text: receiver.username,
                icon_url: receiver.displayAvatarURL({
                    format: "png",
                    dynamic: true
                })
            }
        }
    };
}

export function isAuthorized(guild: Guild | null, channel: TextChannel | DMChannel | NewsChannel): boolean {
    if (guild?.id === "637512823676600330" && channel?.id === "669464416420364288" || process.argv[2] === "dev") return true;
    else {
        channel.send("Sorry, this command can only be used in Monika's emote server. (#mon-stocks)");
        return false;
    }
}