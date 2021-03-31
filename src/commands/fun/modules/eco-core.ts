import Command from "../../../core/command";
import {prompt} from "../../../core/libd";
import {pluralise} from "../../../core/lib";
import {Storage} from "../../../core/structures";
import {isAuthorized, getMoneyEmbed, getSendEmbed, ECO_EMBED_COLOR} from "./eco-utils";

export const DailyCommand = new Command({
    description: "Pick up your daily Mons. The cooldown is per user and every 22 hours to allow for some leeway.",
    aliases: ["get"],
    async run({author, channel, guild}) {
        if (isAuthorized(guild, channel)) {
            const user = Storage.getUser(author.id);
            const now = Date.now();

            if (now - user.lastReceived >= 79200000) {
                user.money++;
                user.lastReceived = now;
                Storage.save();
                channel.send({
                    embed: {
                        title: "Daily Reward",
                        description: "You received 1 Mon!",
                        color: ECO_EMBED_COLOR
                    }
                });
            } else
                channel.send({
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

export const GuildCommand = new Command({
    description: "Get info on the guild's economy as a whole.",
    async run({guild, channel}) {
        if (isAuthorized(guild, channel)) {
            const users = Storage.users;
            let totalAmount = 0;

            for (const ID in users) {
                const user = users[ID];
                totalAmount += user.money;
            }

            channel.send({
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

export const LeaderboardCommand = new Command({
    description: "See the richest players.",
    aliases: ["top"],
    async run({guild, channel, client}) {
        if (isAuthorized(guild, channel)) {
            const users = Storage.users;
            const ids = Object.keys(users);
            ids.sort((a, b) => users[b].money - users[a].money);
            const fields = [];

            for (let i = 0, limit = Math.min(10, ids.length); i < limit; i++) {
                const id = ids[i];
                const user = await client.users.fetch(id);

                fields.push({
                    name: `#${i + 1}. ${user.username}#${user.discriminator}`,
                    value: pluralise(users[id].money, "Mon", "s")
                });
            }

            channel.send({
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

export const PayCommand = new Command({
    description: "Send money to someone.",
    usage: "<user> <amount>",
    run: "Who are you sending this money to?",
    user: new Command({
        run: "You need to enter an amount you're sending!",
        number: new Command({
            async run({args, author, channel, guild}): Promise<any> {
                if (isAuthorized(guild, channel)) {
                    const amount = Math.floor(args[1]);
                    const sender = Storage.getUser(author.id);
                    const target = args[0];
                    const receiver = Storage.getUser(target.id);

                    if (amount <= 0) return channel.send("You must send at least one Mon!");
                    else if (sender.money < amount)
                        return channel.send("You don't have enough Mons for that.", getMoneyEmbed(author));
                    else if (target.id === author.id) return channel.send("You can't send Mons to yourself!");
                    else if (target.bot && process.argv[2] !== "dev")
                        return channel.send("You can't send Mons to a bot!");

                    sender.money -= amount;
                    receiver.money += amount;
                    Storage.save();
                    return channel.send(getSendEmbed(author, target, amount));
                }
            }
        })
    }),
    number: new Command({
        run: "You must use the format `eco pay <user> <amount>`!"
    }),
    any: new Command({
        async run({args, author, channel, guild}) {
            if (isAuthorized(guild, channel)) {
                const last = args.pop();

                if (!/\d+/g.test(last) && args.length === 0)
                    return channel.send("You need to enter an amount you're sending!");

                const amount = Math.floor(last);
                const sender = Storage.getUser(author.id);

                if (amount <= 0) return channel.send("You must send at least one Mon!");
                else if (sender.money < amount)
                    return channel.send("You don't have enough Mons to do that!", getMoneyEmbed(author));
                else if (!guild)
                    return channel.send("You have to use this in a server if you want to send Mons with a username!");

                const username = args.join(" ");
                const member = (
                    await guild.members.fetch({
                        query: username,
                        limit: 1
                    })
                ).first();

                if (!member)
                    return channel.send(
                        `Couldn't find a user by the name of \`${username}\`! If you want to send Mons to someone in a different server, you have to use their user ID!`
                    );
                else if (member.user.id === author.id) return channel.send("You can't send Mons to yourself!");
                else if (member.user.bot && process.argv[2] !== "dev")
                    return channel.send("You can't send Mons to a bot!");

                const target = member.user;

                return prompt(
                    await channel.send(
                        `Are you sure you want to send ${pluralise(
                            amount,
                            "Mon",
                            "s"
                        )} to this person?\n*(This message will automatically be deleted after 10 seconds.)*`,
                        {
                            embed: {
                                color: ECO_EMBED_COLOR,
                                author: {
                                    name: `${target.username}#${target.discriminator}`,
                                    icon_url: target.displayAvatarURL({
                                        format: "png",
                                        dynamic: true
                                    })
                                }
                            }
                        }
                    ),
                    author.id,
                    () => {
                        const receiver = Storage.getUser(target.id);
                        sender.money -= amount;
                        receiver.money += amount;
                        Storage.save();
                        channel.send(getSendEmbed(author, target, amount));
                    }
                );
            }
        }
    })
});
