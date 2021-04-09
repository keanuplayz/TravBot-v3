import {Command, NamedCommand} from "../../../core";
import {Storage} from "../../../structures";
import {isAuthorized, getMoneyEmbed} from "./eco-utils";

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
