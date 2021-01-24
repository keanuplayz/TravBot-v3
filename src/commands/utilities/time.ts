import Command from "../../core/command";
import {Storage} from "../../core/structures";
import {User} from "discord.js";
import moment from "moment";

const DATE_FORMAT = "D MMMM YYYY";
const TIME_FORMAT = "HH:mm:ss";
type DST = "na" | "eu" | "sh";

const DAYLIGHT_SAVINGS_REGIONS: {[region in DST]: string} = {
    na: "North America",
    eu: "Europe",
    sh: "Southern Hemisphere"
};

const DST_NOTE_INFO = `*Note: To make things simple, the way the bot will handle specific points in time when switching Daylight Savings is just to switch at UTC 00:00, ignoring local timezones. After all, there's no need to get this down to the exact hour.*

North America
- Starts: 2nd Sunday March
- Ends: 1st Sunday November

Europe
- Starts: Last Sunday March
- Ends: Last Sunday October

Southern Hemisphere
- Starts: 1st Sunday of October
- Ends: 1st Sunday of April`;

const DST_NOTE_SETUP = `Which daylight savings region most closely matches your own?

North America (1️⃣)
- Starts: 2nd Sunday March
- Ends: 1st Sunday November

Europe (2️⃣)
- Starts: Last Sunday March
- Ends: Last Sunday October

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
    let localTime = "N/A";
    let timezoneOffset = "N/A";

    if (timezone !== null) {
        const daylightSavingsOffset = daylightSavingsRegion && hasDaylightSavings(daylightSavingsRegion) ? 1 : 0;
        const daylightTimezone = timezone + daylightSavingsOffset;
        const now = moment().utcOffset(daylightTimezone * 60);
        localDate = now.format(DATE_FORMAT);
        localTime = now.format(TIME_FORMAT);
        timezoneOffset = daylightTimezone > 0 ? `+${daylightTimezone}` : daylightTimezone.toString();
    }

    const embed = {
        embed: {
            color: 0x000080,
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
                    name: "Local Time",
                    value: localTime
                },
                {
                    name: timezone !== null ? "Current Timezone Offset" : "Timezone Offset",
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

export default new Command({
    description: "Show others what time it is for you.",
    async run({channel, author}) {
        channel.send(getTimeEmbed(author));
    },
    subcommands: {
        setup: new Command({
            description: "Registers your timezone information for the bot.",
            async run({author, channel, ask, askYesOrNo, askMultipleChoice, prompt}) {
                const profile = Storage.getUser(author.id);

                ask(
                    await channel.send(
                        "What hour (0 to 23) is it for you right now?\n*(Note: Make sure to use Discord's inline reply feature or this won't work!)*"
                    ),
                    author.id,
                    (reply) => {
                        const hour = parseInt(reply);

                        if (isNaN(hour)) {
                            return false;
                        }

                        const isValidHour = hour >= 0 && hour <= 23;

                        if (isValidHour) {
                            const date = new Date();
                            profile.timezone = hour - date.getUTCHours();
                        }

                        return isValidHour;
                    },
                    async () => {
                        askYesOrNo(
                            await channel.send("Does your timezone change based on daylight savings?"),
                            author.id,
                            async (hasDST) => {
                                const finalize = () => {
                                    Storage.save();
                                    channel.send(
                                        "You've finished setting up your timezone! Just check to see if this looks right, and if it doesn't, run this setup again.",
                                        getTimeEmbed(author)
                                    );
                                };

                                if (hasDST) {
                                    const finalizeDST = (region: DST) => {
                                        profile.daylightSavingsRegion = region;

                                        // If daylight savings is active, subtract the timezone offset by one to store the standard time.
                                        if (hasDaylightSavings(region)) {
                                            (profile.timezone as number)--;
                                        }

                                        finalize();
                                    };

                                    askMultipleChoice(await channel.send(DST_NOTE_SETUP), author.id, [
                                        () => finalizeDST("na"),
                                        () => finalizeDST("eu"),
                                        () => finalizeDST("sh")
                                    ]);
                                } else {
                                    finalize();
                                }
                            }
                        );
                    },
                    () => {
                        return "you need to enter in a valid integer between 0 to 23";
                    }
                );
            }
        }),
        delete: new Command({
            description: "Delete your timezone information.",
            async run({channel, author, prompt}) {
                prompt(
                    await channel.send(
                        "Are you sure you want to delete your timezone information?\n*(This message will automatically be deleted after 10 seconds.)*"
                    ),
                    author.id,
                    () => {
                        const profile = Storage.getUser(author.id);
                        profile.timezone = null;
                        profile.daylightSavingsRegion = null;
                        Storage.save();
                    }
                );
            }
        }),
        utc: new Command({
            description: "Displays UTC time.",
            async run({channel}) {
                const time = moment().utc();

                channel.send({
                    embed: {
                        color: 0x000080,
                        fields: [
                            {
                                name: "Local Date",
                                value: time.format(DATE_FORMAT)
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
        daylight: new Command({
            description: "Provides information on the daylight savings region",
            run: DST_NOTE_INFO
        })
    },
    user: new Command({
        description: "See what time it is for someone else.",
        async run({channel, args}) {
            channel.send(getTimeEmbed(args[0]));
        }
    }),
    any: new Command({
        description: "See what time it is for someone else (by their username).",
        async run({channel, args, message, callMemberByUsername}) {
            callMemberByUsername(message, args.join(" "), (member) => {
                channel.send(getTimeEmbed(member.user));
            });
        }
    })
});
