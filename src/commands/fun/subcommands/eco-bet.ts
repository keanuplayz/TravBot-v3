import Command from "../../../core/command";
import $ from "../../../core/lib";
import {Storage} from "../../../core/structures";
import {isAuthorized, getMoneyEmbed, getSendEmbed, ECO_EMBED_COLOR} from "./eco-utils";

export const BetCommand = new Command({
    description: "Bet your Mons with other people [TBD]",
    usage: "<user> <amount> <duration>",
    run: "Who are you betting with?",
    user: new Command({
        run: "How much are you betting?",
        number: new Command({
            run: "How long until the bet ends?",
            any: new Command({
                async run({ client, args, author, channel, guild}): Promise<any> {
                    if (isAuthorized(guild, channel)) {
                        const sender = Storage.getUser(author.id);
                        const target = args[0];
                        const receiver = Storage.getUser(target);
                        const amount = Math.floor(args[1]);
                        const duration = parseDuration(args[2].trim());

                        if (amount <= 0) return channel.send("You must bet at least one Mon!");
                        else if (sender.money < amount)
                            return channel.send("You don't have enough Mons for that.", getMoneyEmbed(author));
                        else if (target.id == author.id) return channel.send("You can't bet Mons with yourself!");
                        else if (target.bot && process.argv[2] !== "dev")
                            return channel.send("You can't bet Mons with a bot!");

                        if (duration <= 0)
                            return channel.send("Invalid duration");
                        // else if (duration <= {threshold})
                        //     return channel.send("Too short idk");
                        // else if (duration >= {threshold})
                        //     return channel.send("Too long idk");

                        // SEND MESSAGE WITH 2 REACTIONS (OK / NO)
                        const msg = await channel.send(`<@${target.id}>, do you want to take this bet of ${$(amount).pluralise("Mon", "s")}`);
                        await msg.react("✅");
                        await msg.react("⛔");

                        // SET UP ACCEPT TIMEOUT
                        // ON REACTION CHANGE, CHECK IF NEW REACTION IS FROM TARGET
                        await msg.awaitReactions(
                            async (reaction, user) => {
                        //   IF OK
                                if (user.id === target.id && reaction.emoji.name === "✅") {
                        //     REMOVE AMOUNT FROM AUTHOR
                                    sender.money -= amount;
                        //     REMOVE AMOUNT FROM TARGET
                                    receiver.money -= amount;
                        //     SET BET POOL AS AMOUNT*2
                        //     => BET POOL ALWAYS EVEN
                                    const pool = amount * 2;

                        //     SET UP BET TIMEOUT FROM DURATION
                                    client.setTimeout(async () => {
                        //     ON BET TIMEOUT
                        //       GIVE VOTE WITH 2 REACTIONS (OK / NO)
                                        const voteMsg = await channel.send(`VOTE: do you think that <@${target.id} has won the bet?`);
                                        await voteMsg.react("✅");
                                        await voteMsg.react("⛔");

                        //       SET UP VOTE TIMEOUT
                                        voteMsg.awaitReactions(
                                            (reaction, user) => {
                                                return ["✅", "⛔"].includes(reaction.emoji.name);
                                            },
                                            // waiting for a day for now, might need to make configurable
                                            { time: 8640000 }
                                        ).then(reactions => {
                        //       ON VOTE TIMEOUT
                        //         COUNT OK VOTES
                                            const ok = 0;
                        //         COUNT NO VOTES
                                            const no = 0;
                        //         IF OK > NO
                        //           GIVE TARGET THE BET POOL
                                            if (ok > no) receiver.money += pool;
                        //         ELSE IF OK < NO
                        //           GIVE AUTHOR BET POOL
                                            else if (ok < no) sender.money += pool;
                        //         ELSE
                        //           GIVE TARGET BET POOL / 2
                        //           GIVE AUTHOR BET POOL / 2
                        //           => BET EFFECT CANCELLED
                                            else {
                                                sender.money += amount;
                                                receiver.money += amount;
                                            }
                                        });
                                    }, duration);
                                }
                        //   IF NO
                        //     DROP
                                return false;
                            },
                            // waiting for a minute
                            { time: 60000 }
                        );
                        // ON ACCEPT TIMEOUT
                        //   DROP
                    }
                }
            })
        })
    })
});


/**
 * Parses a duration string into milliseconds
 * Examples:
 * - 3d -> 3 days -> 259200000ms
 * - 3s -> 3 seconds -> 3000ms
 * - 2h -> 2 hours -> 7200000ms
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