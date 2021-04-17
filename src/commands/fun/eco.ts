import {Command, NamedCommand, getUserByNickname, RestCommand} from "onion-lasers";
import {isAuthorized, getMoneyEmbed} from "./modules/eco-utils";
import {DailyCommand, PayCommand, GuildCommand, LeaderboardCommand} from "./modules/eco-core";
import {BuyCommand, ShopCommand} from "./modules/eco-shop";
import {MondayCommand, AwardCommand} from "./modules/eco-extras";
import {BetCommand} from "./modules/eco-bet";

export default new NamedCommand({
    description: "Economy command for Monika.",
    async run({send, guild, channel, author}) {
        if (isAuthorized(guild, channel)) send(getMoneyEmbed(author));
    },
    subcommands: {
        daily: DailyCommand,
        pay: PayCommand,
        guild: GuildCommand,
        leaderboard: LeaderboardCommand,
        buy: BuyCommand,
        shop: ShopCommand,
        monday: MondayCommand,
        bet: BetCommand,
        award: AwardCommand,
        post: new NamedCommand({
            description: "A play on `eco get`",
            run: "`405 Method Not Allowed`"
        })
    },
    id: "user",
    user: new Command({
        description: "See how much money someone else has by using their user ID or pinging them.",
        async run({send, guild, channel, args}) {
            if (isAuthorized(guild, channel)) send(getMoneyEmbed(args[0]));
        }
    }),
    any: new RestCommand({
        description: "See how much money someone else has by using their username.",
        async run({send, guild, channel, combined}) {
            if (isAuthorized(guild, channel)) {
                const user = await getUserByNickname(combined, guild);
                if (typeof user !== "string") send(getMoneyEmbed(user));
                else send(user);
            }
        }
    })
});
