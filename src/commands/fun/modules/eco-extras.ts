import {Command, NamedCommand} from "../../../core";
import {Storage} from "../../../structures";
import {isAuthorized, getMoneyEmbed} from "./eco-utils";
import {User} from "discord.js";
import {pluralise} from "../../../lib";

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const MondayCommand = new NamedCommand({
    description: "Use this on a UTC Monday to get an extra Mon. Does not affect your 22 hour timer for `eco daily`.",
    async run({guild, channel, author}) {
        if (isAuthorized(guild, channel)) {
            const user = Storage.getUser(author.id);
            const now = new Date();
            const weekday = now.getUTCDay();

            // If it's a UTC Monday
            if (weekday === 1) {
                // If the user hasn't already claimed their Monday reward (checks the last 24 hours because that'll block up the entire day)
                if (now.getTime() - user.lastMonday >= 86400000) {
                    user.money++;
                    user.lastMonday = now.getTime();
                    Storage.save();
                    channel.send("It is **Mon**day, my dudes.", getMoneyEmbed(author));
                } else channel.send("You've already claimed your **Mon**day reward for this week.");
            } else {
                const weekdayName = WEEKDAY[weekday];
                const hourText = now.getUTCHours().toString().padStart(2, "0");
                const minuteText = now.getUTCMinutes().toString().padStart(2, "0");
                channel.send(
                    `Come back when it's **Mon**day. Right now, it's ${weekdayName}, ${hourText}:${minuteText} (UTC).`
                );
            }
        }
    }
});

export const AwardCommand = new NamedCommand({
    description: "Only usable by Mon, awards one or a specified amount of Mons to the user.",
    usage: "<user> (<amount>)",
    aliases: ["give"],
    run: "You need to specify a user!",
    user: new Command({
        async run({message, channel, guild, author, member, client, args}) {
            if (author.id === "394808963356688394" || IS_DEV_MODE) {
                const target = args[0] as User;
                const user = Storage.getUser(target.id);
                user.money++;
                Storage.save();
                channel.send(`1 Mon given to ${target.username}.`, getMoneyEmbed(target));
            } else {
                channel.send("This command is restricted to the bean.");
            }
        },
        number: new Command({
            async run({message, channel, guild, author, member, client, args}) {
                if (author.id === "394808963356688394" || IS_DEV_MODE) {
                    const target = args[0] as User;
                    const amount = Math.floor(args[1]);

                    if (amount > 0) {
                        const user = Storage.getUser(target.id);
                        user.money += amount;
                        Storage.save();
                        channel.send(
                            `${pluralise(amount, "Mon", "s")} given to ${target.username}.`,
                            getMoneyEmbed(target)
                        );
                    } else {
                        channel.send("You need to enter a number greater than 0.");
                    }
                } else {
                    channel.send("This command is restricted to the bean.");
                }
            }
        })
    })
});
