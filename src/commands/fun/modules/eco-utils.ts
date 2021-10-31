import {pluralise} from "../../../lib";
import {Storage} from "../../../structures";
import {User, Guild, TextChannel, DMChannel, NewsChannel, Channel, TextBasedChannels} from "discord.js";

export const ECO_EMBED_COLOR = 0xf1c40f;

export function getMoneyEmbed(user: User): object {
    const profile = Storage.getUser(user.id);
    console.log(profile);

    return {
        embeds: [
            {
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
                        value: pluralise(profile.money, "Mon", "s")
                    }
                ]
            }
        ]
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
            description: `${sender.toString()} has sent ${pluralise(amount, "Mon", "s")} to ${receiver.toString()}!`,
            fields: [
                {
                    name: `Sender: ${sender.tag}`,
                    value: pluralise(Storage.getUser(sender.id).money, "Mon", "s")
                },
                {
                    name: `Receiver: ${receiver.tag}`,
                    value: pluralise(Storage.getUser(receiver.id).money, "Mon", "s")
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

export function isAuthorized(guild: Guild | null, channel: TextBasedChannels): boolean {
    if (IS_DEV_MODE) {
        return true;
    }

    if (guild?.id !== "637512823676600330") {
        channel.send("Sorry, this command can only be used in Monika's emote server.");
        return false;
    } else if (channel?.id !== "669464416420364288") {
        channel.send("Sorry, this command can only be used in <#669464416420364288>.");
        return false;
    } else {
        return true;
    }
}
