import {
    Command,
    NamedCommand,
    askForReply,
    confirm,
    askMultipleChoice,
    getUserByNickname,
    RestCommand
} from "onion-lasers";
import {Storage} from "../../structures";
import {User} from "discord.js";
import moment from "moment";

const DATE_FORMAT = "D MMMM YYYY";
const DOW_FORMAT = "dddd";
const TIME_FORMAT = "HH:mm:ss";
type DST = "na" | "eu" | "sh";
const TIME_EMBED_COLOR = 0x191970;

const DAYLIGHT_SAVINGS_REGIONS: {[region in DST]: string} = {
    na: "North America",
    eu: "Europe",
    sh: "Southern Hemisphere"
};

const DST_NOTE_INFO = `*Note: To make things simple, the way the bot will handle specific points in time when switching Daylight Savings is just to switch at UTC 00:00, ignoring local timezones. After all, there's no need to get this down to the exact hour.*

North America
- Starts: 2nd Sunday of March
- Ends: 1st Sunday of November

Europe
- Starts: Last Sunday of March
- Ends: Last Sunday of October

Southern Hemisphere
- Starts: 1st Sunday of October
- Ends: 1st Sunday of April`;

const DST_NOTE_SETUP = `Which daylight savings region most closely matches your own?

North America (1️⃣)
- Starts: 2nd Sunday of March
- Ends: 1st Sunday of November

Europe (2️⃣)
- Starts: Last Sunday of March
- Ends: Last Sunday of October

Southern Hemisphere (3️⃣)
- Starts: 1st Sunday of October
- Ends: 1st Sunday of April`;

const DAYS_OF_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Returns an integer of the specific day the Sunday falls on, -1 if not found
// Also modifies the date object to the specified day as a side effect
function getSunday(date: Date, order: number) {
    const daysInCurrentMonth = DAYS_OF_MONTH[date.getUTCMonth()];
    let occurrencesLeft = order - 1;

    // Search for the last Sunday of the month
    if (order === 0) {
        for (let day = daysInCurrentMonth; day >= 1; day--) {
            date.setUTCDate(day);

            if (date.getUTCDay() === 0) {
                return day;
            }
        }
    } else if (order > 0) {
        for (let day = 1; day <= daysInCurrentMonth; day++) {
            date.setUTCDate(day);

            if (date.getUTCDay() === 0) {
                if (occurrencesLeft > 0) {
                    occurrencesLeft--;
                } else {
                    return day;
                }
            }
        }
    }

    return -1;
}

// region: [firstMonth (0-11), firstOrder, secondMonth (0-11), secondOrder]
const DST_REGION_TABLE = {
    na: [2, 2, 10, 1],
    eu: [2, 0, 9, 0],
    sh: [3, 1, 9, 1] // this one is reversed for the sake of code simplicity
};

// capturing: northern hemisphere is concave, southern hemisphere is convex
function hasDaylightSavings(region: DST) {
    const [firstMonth, firstOrder, secondMonth, secondOrder] = DST_REGION_TABLE[region];
    const date = new Date();
    const now = date.getTime();
    const currentYear = date.getUTCFullYear();
    const firstDate = new Date(Date.UTC(currentYear, firstMonth));
    const secondDate = new Date(Date.UTC(currentYear, secondMonth));
    getSunday(firstDate, firstOrder);
    getSunday(secondDate, secondOrder);
    const insideBounds = now >= firstDate.getTime() && now < secondDate.getTime();
    return region !== "sh" ? insideBounds : !insideBounds;
}

function getTimeEmbed(user: User) {
    const {timezone, daylightSavingsRegion} = Storage.getUser(user.id);
    let localDate = "N/A";
    let dayOfWeek = "N/A";
    let localTime = "N/A";
    let timezoneOffset = "N/A";

    if (timezone !== null) {
        const daylightSavingsOffset = daylightSavingsRegion && hasDaylightSavings(daylightSavingsRegion) ? 1 : 0;
        const daylightTimezone = timezone + daylightSavingsOffset;
        const now = moment().utcOffset(daylightTimezone * 60);
        localDate = now.format(DATE_FORMAT);
        dayOfWeek = now.format(DOW_FORMAT);
        localTime = now.format(TIME_FORMAT);
        timezoneOffset = daylightTimezone >= 0 ? `+${daylightTimezone}` : daylightTimezone.toString();
    }

    const embed = {
        embed: {
            color: TIME_EMBED_COLOR,
            author: {
                name: user.username,
                icon_url: user.displayAvatarURL({
                    format: "png",
                    dynamic: true
                })
            },
            fields: [
                {
                    name: "Local Date",
                    value: localDate
                },
                {
                    name: "Day of the Week",
                    value: dayOfWeek
                },
                {
                    name: "Local Time",
                    value: localTime
                },
                {
                    name: daylightSavingsRegion !== null ? "Current Timezone Offset" : "Timezone Offset",
                    value: timezoneOffset
                },
                {
                    name: "Observes Daylight Savings?",
                    value: daylightSavingsRegion ? "Yes" : "No"
                }
            ]
        }
    };

    if (daylightSavingsRegion) {
        embed.embed.fields.push(
            {
                name: "Daylight Savings Active?",
                value: hasDaylightSavings(daylightSavingsRegion) ? "Yes" : "No"
            },
            {
                name: "Daylight Savings Region",
                value: DAYLIGHT_SAVINGS_REGIONS[daylightSavingsRegion]
            }
        );
    }

    return embed;
}

export default new NamedCommand({
    description: "Show others what time it is for you.",
    aliases: ["tz"],
    async run({send, author}) {
        send(getTimeEmbed(author));
    },
    subcommands: {
        // Welcome to callback hell. We hope you enjoy your stay here!
        setup: new NamedCommand({
            description: "Registers your timezone information for the bot.",
            async run({send, author}) {
                const profile = Storage.getUser(author.id);
                profile.timezone = null;
                profile.daylightSavingsRegion = null;

                // Parse and validate reply
                const reply = await askForReply(
                    await send(
                        "What hour (0 to 23) is it for you right now?\n*(Note: Make sure to use Discord's inline reply feature or this won't work!)*"
                    ),
                    author.id,
                    30000
                );
                if (reply === null) return send("Message timed out.");
                const hour = parseInt(reply.content);
                const isValidHour = !isNaN(hour) && hour >= 0 && hour <= 23;
                if (!isValidHour) return reply.reply("you need to enter in a valid integer between 0 to 23");

                // You need to also take into account whether or not it's the same day in UTC or not.
                // The problem this setup avoids is messing up timezones by 24 hours.
                // For example, the old logic was just (hour - hourUTC). When I setup my timezone (UTC-6) at 18:00, it was UTC 00:00.
                // That means that that formula was doing (18 - 0) getting me UTC+18 instead of UTC-6 because that naive formula didn't take into account a difference in days.

                // (day * 24 + hour) - (day * 24 + hour)
                // Since the timezones will be restricted to -12 to +14, you'll be given three options.
                // The end of the month should be calculated automatically, you should have enough information at that point.

                // But after mapping out the edge cases, I figured out that you can safely gather accurate information just based on whether the UTC day matches the user's day.
                // 21:xx (-12, -d) -- 09:xx (+0, 0d) -- 23:xx (+14, 0d)
                // 22:xx (-12, -d) -- 10:xx (+0, 0d) -- 00:xx (+14, +d)
                // 23:xx (-12, -d) -- 11:xx (+0, 0d) -- 01:xx (+14, +d)
                // 00:xx (-12, 0d) -- 12:xx (+0, 0d) -- 02:xx (+14, +d)

                // For example, 23:xx (-12) - 01:xx (+14) shows that even the edge cases of UTC-12 and UTC+14 cannot overlap, so the dataset can be reduced to a yes or no option.
                // - 23:xx same day = +0, 23:xx diff day = -1
                // - 00:xx same day = +0, 00:xx diff day = +1
                // - 01:xx same day = +0, 01:xx diff day = +1

                // First, create a tuple list matching each possible hour-dayOffset-timezoneOffset combination. In the above example, it'd go something like this:
                // [[23, -1, -12], [0, 0, -11], ..., [23, 0, 12], [0, 1, 13], [1, 1, 14]]
                // Then just find the matching one by filtering through dayOffset (equals zero or not), then the hour from user input.
                // Remember that you don't know where the difference in day might be at this point, so you can't do (hour - hourUTC) safely.
                // In terms of the equation, you're missing a variable in (--> day <-- * 24 + hour) - (day * 24 + hour). That's what the loop is for.

                // Now you might be seeing a problem with setting this up at the end/beginning of a month, but that actually isn't a problem.
                // Let's say that it's 00:xx of the first UTC day of a month. hourSumUTC = 24
                // UTC-12 --> hourSumLowerBound (hourSumUTC - 12) = 12
                // UTC+14 --> hourSumUpperBound (hourSumUTC + 14) = 38
                // Remember, the nice thing about making these bounds relative to the UTC hour sum is that there can't be any conflicts even at the edges of months.
                // And remember that we aren't using this question: (day * 24 + hour) - (day * 24 + hour). We're drawing from a list which does not store its data in absolute terms.
                // That means there's no 31st, 1st, 2nd, it's -1, 0, +1. I just need to make sure to calculate an offset to subtract from the hour sums.

                const date = new Date(); // e.g. 2021-05-01 @ 05:00
                const day = date.getUTCDate(); // e.g. 1
                const hourSumUTC = day * 24 + date.getUTCHours(); // e.g. 29
                const timezoneTupleList: [number, number, number][] = [];
                const uniques: number[] = []; // only for temporary use
                const duplicates = [];

                // Setup the tuple list in a separate block.
                for (let timezoneOffset = -12; timezoneOffset <= 14; timezoneOffset++) {
                    const hourSum = hourSumUTC + timezoneOffset; // e.g. 23, UTC-6 (17 to 43)
                    const hour = hourSum % 24; // e.g. 23
                    // This works because you get the # of days w/o hours minus UTC days without hours.
                    // Since it's all relative to UTC, it'll end up being -1, 0, or 1.
                    const dayOffset = Math.floor(hourSum / 24) - day; // e.g. -1
                    timezoneTupleList.push([hour, dayOffset, timezoneOffset]);

                    if (uniques.includes(hour)) {
                        duplicates.push(hour);
                    } else {
                        uniques.push(hour);
                    }
                }

                // I calculate the list beforehand and check for duplicates to reduce unnecessary asking.
                if (duplicates.includes(hour)) {
                    const isSameDay = await confirm(
                        await send(`Is the current day of the month the ${moment().utc().format("Do")} for you?`),
                        author.id
                    );

                    // Filter through isSameDay (aka !hasDayOffset) then hour from user-generated input.
                    // isSameDay is checked first to reduce the amount of conditionals per loop.
                    if (isSameDay) {
                        for (const [hourPoint, dayOffset, timezoneOffset] of timezoneTupleList) {
                            if (dayOffset === 0 && hour === hourPoint) {
                                profile.timezone = timezoneOffset;
                            }
                        }
                    } else {
                        for (const [hourPoint, dayOffset, timezoneOffset] of timezoneTupleList) {
                            if (dayOffset !== 0 && hour === hourPoint) {
                                profile.timezone = timezoneOffset;
                            }
                        }
                    }
                } else {
                    // If it's a unique hour, just search through the tuple list and find the matching entry.
                    for (const [hourPoint, _dayOffset, timezoneOffset] of timezoneTupleList) {
                        if (hour === hourPoint) {
                            profile.timezone = timezoneOffset;
                        }
                    }
                }

                // I should note that error handling should be added sometime because await throws an exception on Promise.reject.
                const hasDST = await confirm(
                    await send("Does your timezone change based on daylight savings?"),
                    author.id
                );

                const finalize = () => {
                    Storage.save();
                    send(
                        "You've finished setting up your timezone! Just check to see if this looks right, and if it doesn't, run this setup again.",
                        getTimeEmbed(author)
                    );
                };

                if (hasDST) {
                    const finalizeDST = (region: DST) => {
                        profile.daylightSavingsRegion = region;

                        // If daylight savings is active, subtract the timezone offset by one to store the standard time.
                        if (hasDaylightSavings(region)) {
                            profile.timezone!--;
                        }

                        finalize();
                    };

                    const index = await askMultipleChoice(await send(DST_NOTE_SETUP), author.id, 3);

                    switch (index) {
                        case 0:
                            finalizeDST("na");
                            break;
                        case 1:
                            finalizeDST("eu");
                            break;
                        case 2:
                            finalizeDST("sh");
                            break;
                    }
                } else {
                    finalize();
                }

                return;
            }
        }),
        delete: new NamedCommand({
            description: "Delete your timezone information.",
            async run({send, author}) {
                const result = await confirm(
                    await send("Are you sure you want to delete your timezone information?"),
                    author.id
                );

                if (result) {
                    const profile = Storage.getUser(author.id);
                    profile.timezone = null;
                    profile.daylightSavingsRegion = null;
                    Storage.save();
                }
            }
        }),
        utc: new NamedCommand({
            description: "Displays UTC time.",
            async run({send}) {
                const time = moment().utc();

                send({
                    embed: {
                        color: TIME_EMBED_COLOR,
                        fields: [
                            {
                                name: "Local Date",
                                value: time.format(DATE_FORMAT)
                            },
                            {
                                name: "Day of the Week",
                                value: time.format(DOW_FORMAT)
                            },
                            {
                                name: "Local Time",
                                value: time.format(TIME_FORMAT)
                            }
                        ]
                    }
                });
            }
        }),
        daylight: new NamedCommand({
            description: "Provides information on the daylight savings region",
            run: DST_NOTE_INFO
        })
    },
    id: "user",
    user: new Command({
        description: "See what time it is for someone else.",
        async run({send, args}) {
            send(getTimeEmbed(args[0]));
        }
    }),
    any: new RestCommand({
        description: "See what time it is for someone else (by their username).",
        async run({send, guild, combined}) {
            const user = await getUserByNickname(combined, guild);
            if (typeof user !== "string") send(getTimeEmbed(user));
            else send(user);
        }
    })
});
