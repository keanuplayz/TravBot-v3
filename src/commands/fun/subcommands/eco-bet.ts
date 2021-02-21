import Command from "../../../core/command";
import $ from "../../../core/lib";
import {Storage} from "../../../core/structures";
import {isAuthorized, getMoneyEmbed, getSendEmbed, ECO_EMBED_COLOR} from "./eco-utils";

export const BetCommand = new Command({
    description: "Bet your Mons with other people [TBD]",
    usage: "<user> <amount> <duration>",
    run: "Who are you betting with?",
    user: new Command({
        // handles missing amount argument
        async run({args, author, channel, guild}): Promise<any> {
            if (isAuthorized(guild, channel)) {
                const target = args[0];

                // handle invalid target
                if (target.id == author.id)
                    return channel.send("You can't bet Mons with yourself!");
                else if (target.bot && process.argv[2] !== "dev")
                    return channel.send("You can't bet Mons with a bot!");

                return channel.send("How much are you betting?");
            }
        },
        number: new Command({
            // handles missing duration argument
            async run({args, author, channel, guild}): Promise<any> {
                if (isAuthorized(guild, channel)) {
                    const sender = Storage.getUser(author.id);
                    const target = args[0];
                    const receiver = Storage.getUser(target);
                    const amount = Math.floor(args[1]);

                    // handle invalid target
                    if (target.id == author.id)
                        return channel.send("You can't bet Mons with yourself!");
                    else if (target.bot && process.argv[2] !== "dev")
                        return channel.send("You can't bet Mons with a bot!");

                    // handle invalid amount
                    if (amount <= 0)
                        return channel.send("You must bet at least one Mon!");
                    else if (sender.money < amount)
                        return channel.send("You don't have enough Mons for that.", getMoneyEmbed(author));

                    return channel.send("How long until the bet ends?");
                }
            },
            any: new Command({
                async run({client, args, author, message, channel, guild}): Promise<any> {
                    if (isAuthorized(guild, channel)) {
                        // [Pertinence to make configurable on the fly.]
                        // Lower and upper bounds for bet
                        const durationBounds = { min:"1m", max:"1d" };

                        const sender = Storage.getUser(author.id);
                        const target = args[0];
                        const receiver = Storage.getUser(target);
                        const amount = Math.floor(args[1]);
                        const duration = parseDuration(args[2].trim());

                        // handle invalid target
                        if (target.id == author.id)
                            return channel.send("You can't bet Mons with yourself!");
                        else if (target.bot && process.argv[2] !== "dev")
                            return channel.send("You can't bet Mons with a bot!");

                        // handle invalid amount
                        if (amount <= 0)
                            return channel.send("You must bet at least one Mon!");
                        else if (sender.money < amount)
                            return channel.send("You don't have enough Mons for that.", getMoneyEmbed(author));

                        // handle invalid duration
                        if (duration <= 0)
                            return channel.send("Invalid bet duration");
                        else if (duration <= parseDuration(durationBounds.min))
                            return channel.send(`Bet duration is too short, maximum duration is ${durationBounds.min}`);
                        else if (duration >= parseDuration(durationBounds.max))
                            return channel.send(`Bet duration is too long, maximum duration is ${durationBounds.max}`);

                        // Ask target whether or not they want to take the bet.
                        const takeBet = await askYesOrNo(
                            await channel.send(`<@${target.id}>, do you want to take this bet of ${$(amount).pluralise("Mon", "s")}`),
                            target.id
                        );

                        if (takeBet) {
                            // [MEDIUM PRIORITY: bet persistence to prevent losses in case of shutdown.]
                            // Remove amount money from both parts at the start to avoid duplication of money.
                            sender.money -= amount;
                            receiver.money -= amount;
                            Storage.save();

                            // Notify both users.
                            await channel.send(`<@${target.id}> has taken <@${author.id}>'s bet, the bet amount of ${$(amount).pluralise("Mon", "s")} has been deducted from each of them.`);

                            // Wait for the duration of the bet. 
                            client.setTimeout(async () => {
                                // [TODO: when D.JSv13 comes out, inline reply to clean up.]
                                // When bet is over, give a vote to ask people their thoughts.
                                const voteMsg = await channel.send(`VOTE: do you think that <@${target.id}> has won the bet?\nhttps://discord.com/channels/${guild.id}/${channel.id}/${message.id}`);
                                await voteMsg.react("✅");
                                await voteMsg.react("❌");

                                // Filter reactions to only collect the pertinent ones.
                                voteMsg.awaitReactions(
                                    (reaction, user) => {
                                        return ["✅", "❌"].includes(reaction.emoji.name);
                                    },
                                    // [Pertinence to make configurable on the fly.]
                                    { time: parseDuration("2m") }
                                ).then(reactions => {
                                    // Count votes 
                                    const ok = reactions.filter(reaction => reaction.emoji.name === "✅").size;
                                    const no = reactions.filter(reaction => reaction.emoji.name === "❌").size;

                                    if (ok > no) {
                                        receiver.money += amount * 2;
                                        channel.send(`By the people's votes, <@${target.id}> has won the bet that <@${author.id}> had sent them.`);
                                    }
                                    else if (ok < no) {
                                        sender.money += amount * 2;
                                        channel.send(`By the people's votes, <@${target.id}> has lost the bet that <@${author.id}> had sent them.`);
                                    }
                                    else {
                                        sender.money += amount;
                                        receiver.money += amount;
                                        channel.send(`By the people's votes, <@${target.id}> couldn't be determined to have won or lost the bet that <@${author.id}> had sent them.`);
                                    }
                                    Storage.save();
                                });
                            }, duration);
                        }
                        else 
                            await channel.send(`<@${target.id}> has rejected your bet, <@${author.id}>`);
                    }
                }
            })
        })
    })
});


/**
 * Parses a duration string into milliseconds
 * Examples:
 * - 3d -> 3 days    -> 259200000ms
 * - 2h -> 2 hours   -> 7200000ms
 * - 7m -> 7 minutes -> 420000ms
 * - 3s -> 3 seconds -> 3000ms
 */
function parseDuration(duration: string): number {
    // extract last char as unit
    const unit = duration[duration.length - 1].toLowerCase();
    // get the rest as value
    let value: number = +duration.substring(0, duration.length - 1);

    if (!["d","h","m","s"].includes(unit) || isNaN(value))
        return 0;

    if (unit === "d")
        value *= 86400000; // 1000ms * 60s * 60m * 24h
    else if (unit === "h")
        value *= 3600000; // 1000ms * 60s * 60m
    else if (unit === "m")
        value *= 60000; // 1000ms * 60s
    else if (unit === "s")
        value *= 1000; // 1000ms

    return value;
}
