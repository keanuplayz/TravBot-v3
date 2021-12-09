import {User, pluralise} from "../../../lib";
import {User as DiscordUser, Guild, TextBasedChannels} from "discord.js";

export const ECO_EMBED_COLOR = 0xf1c40f;

export function getMoneyEmbed(user: DiscordUser, inline: boolean = false): object {
    const profile = new User(user.id);
    console.log(profile);

    if (inline) {
        return {
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
        };
    } else {
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
}

export function getSendEmbed(sender: DiscordUser, receiver: DiscordUser, amount: number): object {
    return {
        embeds: [
            {
                color: ECO_EMBED_COLOR,
                author: {
                    name: sender.username,
                    icon_url: sender.displayAvatarURL({
                        format: "png",
                        dynamic: true
                    })
                },
                title: "Transaction",
                description: `${sender.toString()} has sent ${pluralise(
                    amount,
                    "Mon",
                    "s"
                )} to ${receiver.toString()}!`,
                fields: [
                    {
                        name: `Sender: ${sender.tag}`,
                        value: pluralise(new User(sender.id).money, "Mon", "s")
                    },
                    {
                        name: `Receiver: ${receiver.tag}`,
                        value: pluralise(new User(receiver.id).money, "Mon", "s")
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
        ]
    };
}

export function isAuthorized(guild: Guild | null, channel: TextBasedChannels): boolean {
    if (process.env.DEV) {
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
