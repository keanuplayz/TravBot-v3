import {Command, getUserByNickname, NamedCommand, confirm, RestCommand} from "onion-lasers";
import {pluralise} from "../../../lib";
import {Storage} from "../../../structures";
import {isAuthorized, getMoneyEmbed, getSendEmbed, ECO_EMBED_COLOR} from "./eco-utils";

export const DailyCommand = new NamedCommand({
    description: "Pick up your daily Mons. The cooldown is per user and every 22 hours to allow for some leeway.",
    aliases: ["get"],
    async run({send, author, channel, guild}) {
        if (isAuthorized(guild, channel)) {
            const user = Storage.getUser(author.id);
            const now = Date.now();

            if (now - user.lastReceived >= 79200000) {
                user.money++;
                user.lastReceived = now;
                Storage.save();
                send({
                    embed: {
                        title: "Daily Reward",
                        description: "You received 1 Mon!",
                        color: ECO_EMBED_COLOR
                    }
                });
            } else
                send({
                    embed: {
                        title: "Daily Reward",
                        description: `It's too soon to pick up your daily Mons. You have about ${(
                            (user.lastReceived + 79200000 - now) /
                            3600000
                        ).toFixed(1)} hours to go.`,
                        color: ECO_EMBED_COLOR
                    }
                });
        }
    }
});

export const GuildCommand = new NamedCommand({
    description: "Get info on the guild's economy as a whole.",
    async run({send, guild, channel}) {
        if (isAuthorized(guild, channel)) {
            const users = Storage.users;
            let totalAmount = 0;

            for (const ID in users) {
                const user = users[ID];
                totalAmount += user.money;
            }

            send({
                embed: {
                    title: `The Bank of ${guild!.name}`,
                    color: ECO_EMBED_COLOR,
                    fields: [
                        {
                            name: "Accounts",
                            value: Object.keys(users).length,
                            inline: true
                        },
                        {
                            name: "Total Mons",
                            value: totalAmount,
                            inline: true
                        }
                    ],
                    thumbnail: {
                        url: guild?.iconURL() ?? ""
                    }
                }
            });
        }
    }
});

export const LeaderboardCommand = new NamedCommand({
    description: "See the richest players.",
    aliases: ["top"],
    async run({send, guild, channel, client}) {
        if (isAuthorized(guild, channel)) {
            const users = Storage.users;
            const ids = Object.keys(users);
            ids.sort((a, b) => users[b].money - users[a].money);
            const fields = [];

            for (let i = 0, limit = Math.min(10, ids.length); i < limit; i++) {
                const id = ids[i];
                const user = await client.users.fetch(id);

                fields.push({
                    name: `#${i + 1}. ${user.tag}`,
                    value: pluralise(users[id].money, "Mon", "s")
                });
            }

            send({
                embed: {
                    title: "Top 10 Richest Players",
                    color: ECO_EMBED_COLOR,
                    fields: fields,
                    thumbnail: {
                        url: guild?.iconURL() ?? ""
                    }
                }
            });
        }
    }
});

export const PayCommand = new NamedCommand({
    description: "Send money to someone.",
    usage: "<user> <amount>",
    run: "Who are you sending this money to?",
    id: "user",
    user: new Command({
        run: "You need to enter an amount you're sending!",
        number: new Command({
            async run({send, args, author, channel, guild}): Promise<any> {
                if (isAuthorized(guild, channel)) {
                    const amount = Math.floor(args[1]);
                    const sender = Storage.getUser(author.id);
                    const target = args[0];
                    const receiver = Storage.getUser(target.id);

                    if (amount <= 0) return send("You must send at least one Mon!");
                    else if (sender.money < amount)
                        return send("You don't have enough Mons for that.", getMoneyEmbed(author));
                    else if (target.id === author.id) return send("You can't send Mons to yourself!");
                    else if (target.bot && !IS_DEV_MODE) return send("You can't send Mons to a bot!");

                    sender.money -= amount;
                    receiver.money += amount;
                    Storage.save();
                    return send(getSendEmbed(author, target, amount));
                }
            }
        })
    }),
    number: new Command({
        run: "You must use the format `eco pay <user> <amount>`!"
    }),
    any: new RestCommand({
        async run({send, args, author, channel, guild, combined}) {
            if (isAuthorized(guild, channel)) {
                const last = args.pop();

                if (!/\d+/g.test(last) && args.length === 0) return send("You need to enter an amount you're sending!");

                const amount = Math.floor(last);
                const sender = Storage.getUser(author.id);

                if (amount <= 0) return send("You must send at least one Mon!");
                else if (sender.money < amount)
                    return send("You don't have enough Mons to do that!", getMoneyEmbed(author));
                else if (!guild)
                    return send("You have to use this in a server if you want to send Mons with a username!");

                const user = await getUserByNickname(combined, guild);
                if (typeof user === "string") return send(user);
                else if (user.id === author.id) return send("You can't send Mons to yourself!");
                else if (user.bot && !IS_DEV_MODE) return send("You can't send Mons to a bot!");

                const confirmed = await confirm(
                    await send(`Are you sure you want to send ${pluralise(amount, "Mon", "s")} to this person?`, {
                        embed: {
                            color: ECO_EMBED_COLOR,
                            author: {
                                name: user.tag,
                                icon_url: user.displayAvatarURL({
                                    format: "png",
                                    dynamic: true
                                })
                            }
                        }
                    }),
                    author.id
                );

                if (confirmed) {
                    const receiver = Storage.getUser(user.id);
                    sender.money -= amount;
                    receiver.money += amount;
                    Storage.save();
                    send(getSendEmbed(author, user, amount));
                }
            }

            return;
        }
    })
});
