import {Command, NamedCommand, confirm, poll} from "onion-lasers";
import {pluralise} from "../../../lib";
import {Storage} from "../../../structures";
import {isAuthorized, getMoneyEmbed} from "./eco-utils";
import {User} from "discord.js";

export const BetCommand = new NamedCommand({
    description: "Bet your Mons with other people.",
    usage: "<user> <amount> <duration>",
    run: "Who are you betting with?",
    user: new Command({
        description: "User to bet with.",
        // handles missing amount argument
        async run({send, args, author, channel, guild}) {
            if (isAuthorized(guild, channel)) {
                const target = args[0];

                // handle invalid target
                if (target.id == author.id) return send("You can't bet Mons with yourself!");
                else if (target.bot && process.argv[2] !== "dev") return send("You can't bet Mons with a bot!");

                return send("How much are you betting?");
            } else return;
        },
        number: new Command({
            description: "Amount of Mons to bet.",
            // handles missing duration argument
            async run({send, args, author, channel, guild}) {
                if (isAuthorized(guild, channel)) {
                    const sender = Storage.getUser(author.id);
                    const target = args[0] as User;
                    const receiver = Storage.getUser(target.id);
                    const amount = Math.floor(args[1]);

                    // handle invalid target
                    if (target.id == author.id) return send("You can't bet Mons with yourself!");
                    else if (target.bot && process.argv[2] !== "dev") return send("You can't bet Mons with a bot!");

                    // handle invalid amount
                    if (amount <= 0) return send("You must bet at least one Mon!");
                    else if (sender.money < amount)
                        return send("You don't have enough Mons for that.", getMoneyEmbed(author));
                    else if (receiver.money < amount)
                        return send("They don't have enough Mons for that.", getMoneyEmbed(target));

                    return send("How long until the bet ends?");
                } else return;
            },
            any: new Command({
                description: "Duration of the bet.",
                async run({send, client, args, author, message, channel, guild}) {
                    if (isAuthorized(guild, channel)) {
                        // [Pertinence to make configurable on the fly.]
                        // Lower and upper bounds for bet
                        const durationBounds = {min: "1m", max: "1d"};

                        const sender = Storage.getUser(author.id);
                        const target = args[0] as User;
                        const receiver = Storage.getUser(target.id);
                        const amount = Math.floor(args[1]);
                        const duration = parseDuration(args[2].trim());

                        // handle invalid target
                        if (target.id == author.id) return send("You can't bet Mons with yourself!");
                        else if (target.bot && !IS_DEV_MODE) return send("You can't bet Mons with a bot!");

                        // handle invalid amount
                        if (amount <= 0) return send("You must bet at least one Mon!");
                        else if (sender.money < amount)
                            return send("You don't have enough Mons for that.", getMoneyEmbed(author));
                        else if (receiver.money < amount)
                            return send("They don't have enough Mons for that.", getMoneyEmbed(target));

                        // handle invalid duration
                        if (duration <= 0) return send("Invalid bet duration");
                        else if (duration <= parseDuration(durationBounds.min))
                            return send(`Bet duration is too short, maximum duration is ${durationBounds.min}`);
                        else if (duration >= parseDuration(durationBounds.max))
                            return send(`Bet duration is too long, maximum duration is ${durationBounds.max}`);

                        // Ask target whether or not they want to take the bet.
                        const takeBet = await confirm(
                            await send(
                                `<@${target.id}>, do you want to take this bet of ${pluralise(amount, "Mon", "s")}`
                            ),
                            target.id
                        );

                        if (!takeBet) return send(`<@${target.id}> has rejected your bet, <@${author.id}>`);

                        // [MEDIUM PRIORITY: bet persistence to prevent losses in case of shutdown.]
                        // Remove amount money from both parts at the start to avoid duplication of money.
                        sender.money -= amount;
                        receiver.money -= amount;
                        // Very hacky solution for persistence but better than no solution, backup returns runs during the bot's setup code.
                        sender.ecoBetInsurance += amount;
                        receiver.ecoBetInsurance += amount;
                        Storage.save();

                        // Notify both users.
                        send(
                            `<@${target.id}> has taken <@${author.id}>'s bet, the bet amount of ${pluralise(
                                amount,
                                "Mon",
                                "s"
                            )} has been deducted from each of them.`
                        );

                        // Wait for the duration of the bet.
                        return client.setTimeout(async () => {
                            // In debug mode, saving the storage will break the references, so you have to redeclare sender and receiver for it to actually save.
                            const sender = Storage.getUser(author.id);
                            const receiver = Storage.getUser(target.id);
                            // [TODO: when D.JSv13 comes out, inline reply to clean up.]
                            // When bet is over, give a vote to ask people their thoughts.
                            // Filter reactions to only collect the pertinent ones.
                            const results = await poll(
                                await send(
                                    `VOTE: do you think that <@${
                                        target.id
                                    }> has won the bet?\nhttps://discord.com/channels/${guild!.id}/${channel.id}/${
                                        message.id
                                    }`
                                ),
                                ["✅", "❌"],
                                // [Pertinence to make configurable on the fly.]
                                parseDuration("2m")
                            );

                            // Count votes
                            const ok = results["✅"];
                            const no = results["❌"];

                            if (ok > no) {
                                receiver.money += amount * 2;
                                send(`By the people's votes, ${target} has won the bet that ${author} had sent them.`);
                            } else if (ok < no) {
                                sender.money += amount * 2;
                                send(`By the people's votes, ${target} has lost the bet that ${author} had sent them.`);
                            } else {
                                sender.money += amount;
                                receiver.money += amount;
                                send(
                                    `By the people's votes, ${target} couldn't be determined to have won or lost the bet that ${author} had sent them.`
                                );
                            }

                            sender.ecoBetInsurance -= amount;
                            receiver.ecoBetInsurance -= amount;
                            Storage.save();
                        }, duration);
                    } else return;
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

    if (!["d", "h", "m", "s"].includes(unit) || isNaN(value)) return 0;

    if (unit === "d") value *= 86400000;
    // 1000ms * 60s * 60m * 24h
    else if (unit === "h") value *= 3600000;
    // 1000ms * 60s * 60m
    else if (unit === "m") value *= 60000;
    // 1000ms * 60s
    else if (unit === "s") value *= 1000; // 1000ms

    return value;
}
