import {Command, NamedCommand, callMemberByUsername} from "../../core";
import {isAuthorized, getMoneyEmbed} from "./modules/eco-utils";
import {DailyCommand, PayCommand, GuildCommand, LeaderboardCommand} from "./modules/eco-core";
import {BuyCommand, ShopCommand} from "./modules/eco-shop";
import {MondayCommand} from "./modules/eco-extras";

export default new NamedCommand({
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
        monday: MondayCommand
    },
    user: new Command({
        description: "See how much money someone else has by using their user ID or pinging them.",
        async run({guild, channel, args}) {
            if (isAuthorized(guild, channel)) channel.send(getMoneyEmbed(args[0]));
        }
    }),
    any: new Command({
        description: "See how much money someone else has by using their username.",
        async run({guild, channel, args, message}) {
            if (isAuthorized(guild, channel))
                callMemberByUsername(message, args.join(" "), (member) => {
                    channel.send(getMoneyEmbed(member.user));
                });
        }
    })
});
