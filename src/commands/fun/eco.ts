import Command from "../../core/command";
import {isAuthorized, getMoneyEmbed} from "./subcommands/eco-utils";
import {DailyCommand, PayCommand, GuildCommand, LeaderboardCommand} from "./subcommands/eco-core";
import {BuyCommand, ShopCommand} from "./subcommands/eco-shop";
import {MondayCommand} from "./subcommands/eco-extras";
import {BetCommand} from "./subcommands/eco-bet";

export default new Command({
    description: "Economy command for Monika.",
    async run({guild, channel, author}) {
        if (isAuthorized(guild, channel)) channel.send(getMoneyEmbed(author));
    },
    subcommands: {
        daily: DailyCommand,
        pay: PayCommand,
        guild: GuildCommand,
        leaderboard: LeaderboardCommand,
        buy: BuyCommand,
        shop: ShopCommand,
        monday: MondayCommand,
        bet: BetCommand
    },
    user: new Command({
        description: "See how much money someone else has by using their user ID or pinging them.",
        async run({guild, channel, args}) {
            if (isAuthorized(guild, channel)) channel.send(getMoneyEmbed(args[0]));
        }
    }),
    any: new Command({
        description: "See how much money someone else has by using their username.",
        async run({guild, channel, args, callMemberByUsername, message}) {
            if (isAuthorized(guild, channel))
                callMemberByUsername(message, args.join(" "), (member) => {
                    channel.send(getMoneyEmbed(member.user));
                });
        }
    })
});
