import {Command, getUserByNickname, NamedCommand, confirm, RestCommand} from "onion-lasers";
import {User, pluralise} from "../../../lib";
import {isAuthorized, getMoneyEmbed, getSendEmbed, ECO_EMBED_COLOR} from "./eco-utils";

export const DailyCommand = new NamedCommand({
    description: "Pick up your daily Mons. The cooldown is per user and every 22 hours to allow for some leeway.",
    aliases: ["get"],
    async run({send, author, channel, guild}) {
        if (isAuthorized(guild, channel)) {
            const user = new User(author.id);
            const now = Date.now();

            if (now - user.lastReceived >= 79200000) {
                user.money++;
                user.lastReceived = now;
                send({
                    embeds: [
                        {
                            title: "Daily Reward",
                            description: "You received 1 Mon!",
                            color: ECO_EMBED_COLOR,
                            fields: [
                                {
                                    name: "New balance:",
                                    value: pluralise(user.money, "Mon", "s")
                                }
                            ]
                        }
                    ]
                });
            } else
                send({
                    embeds: [
                        {
                            title: "Daily Reward",
                            description: `It's too soon to pick up your daily Mons. Try again at <t:${Math.floor(
                                (user.lastReceived + 79200000) / 1000
                            )}:t>.`,
                            color: ECO_EMBED_COLOR
                        }
                    ]
                });
        }
    }
});

export const GuildCommand = new NamedCommand({
    description: "Get info on the guild's economy as a whole.",
    async run({send, guild, channel}) {
        if (isAuthorized(guild, channel)) {
            const users = User.all();
            let totalAmount = 0;

            for (const user of users) {
                totalAmount += user.money;
            }

            send({
                embeds: [
                    {
                        title: `The Bank of ${guild!.name}`,
                        color: ECO_EMBED_COLOR,
                        fields: [
                            {
                                name: "Accounts",
                                value: Object.keys(users).length.toString(),
                                inline: true
                            },
                            {
                                name: "Total Mons",
                                value: totalAmount.toString(),
                                inline: true
                            }
                        ],
                        thumbnail: {
                            url: guild?.iconURL() ?? ""
                        }
                    }
                ]
            });
        }
    }
});

export const LeaderboardCommand = new NamedCommand({
    description: "See the richest players.",
    aliases: ["top"],
    async run({send, guild, channel, client}) {
        if (isAuthorized(guild, channel)) {
            const users = User.all();
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
                embeds: [
                    {
                        title: "Top 10 Richest Players",
                        color: ECO_EMBED_COLOR,
                        fields: fields,
                        thumbnail: {
                            url: guild?.iconURL() ?? ""
                        }
                    }
                ]
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
                    const sender = new User(author.id);
                    const target = args[0];
                    const receiver = new User(target.id);

                    if (amount <= 0) return send("You must send at least one Mon!");
                    else if (sender.money < amount)
                        return send({
                            content: "You don't have enough Mons for that.",
                            embeds: [getMoneyEmbed(author, true)]
                        });
                    else if (target.id === author.id) return send("You can't send Mons to yourself!");
                    else if (target.bot && !process.env.DEV) return send("You can't send Mons to a bot!");

                    sender.money -= amount;
                    receiver.money += amount;
                    return send(getSendEmbed(author, target, amount));
                }
            }
        })
    }),
    number: new Command({
        run: "You must use the format `eco pay <user> <amount>`!"
    }),
    any: new RestCommand({
        async run({send, args, author, channel, guild}) {
            if (isAuthorized(guild, channel)) {
                const last = args.pop();

                if (!/\d+/g.test(last) && args.length === 0) return send("You need to enter an amount you're sending!");

                const amount = Math.floor(last);
                const sender = new User(author.id);

                if (amount <= 0) return send("You must send at least one Mon!");
                else if (sender.money < amount)
                    return send({
                        content: "You don't have enough Mons to do that!",
                        embeds: [getMoneyEmbed(author, true)]
                    });
                else if (!guild)
                    return send("You have to use this in a server if you want to send Mons with a username!");

                // Do NOT use the combined parameter here, it won't account for args.pop() at the start.
                const user = await getUserByNickname(args.join(" "), guild);
                if (typeof user === "string") return send(user);
                else if (user.id === author.id) return send("You can't send Mons to yourself!");
                else if (user.bot && !process.env.DEV) return send("You can't send Mons to a bot!");

                const confirmed = await confirm(
                    await send({
                        content: `Are you sure you want to send ${pluralise(amount, "Mon", "s")} to this person?`,
                        embeds: [
                            {
                                color: ECO_EMBED_COLOR,
                                author: {
                                    name: user.tag,
                                    icon_url: user.displayAvatarURL({
                                        format: "png",
                                        dynamic: true
                                    })
                                }
                            }
                        ]
                    }),
                    author.id
                );

                if (confirmed) {
                    const receiver = new User(user.id);
                    sender.money -= amount;
                    receiver.money += amount;
                    send(getSendEmbed(author, user, amount));
                }
            }

            return;
        }
    })
});
