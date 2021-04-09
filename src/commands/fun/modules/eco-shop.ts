import {Command, NamedCommand, paginate} from "../../../core";
import {pluralise, split} from "../../../lib";
import {Storage, getPrefix} from "../../../structures";
import {isAuthorized, ECO_EMBED_COLOR} from "./eco-utils";
import {ShopItems, ShopItem} from "./eco-shop-items";
import {EmbedField} from "discord.js";

export const ShopCommand = new NamedCommand({
    description: "Displays the list of items you can buy in the shop.",
    async run({guild, channel, author}) {
        if (isAuthorized(guild, channel)) {
            function getShopEmbed(selection: ShopItem[], title: string) {
                const fields: EmbedField[] = [];

                for (const item of selection)
                    fields.push({
                        name: `**${item.title}** (${getPrefix(guild)}eco buy ${item.usage})`,
                        value: `${item.description} Costs ${pluralise(item.cost, "Mon", "s")}.`,
                        inline: false
                    });

                return {
                    embed: {
                        color: ECO_EMBED_COLOR,
                        title: title,
                        fields: fields,
                        footer: {
                            text: "Mon Shop | TravBot Services"
                        }
                    }
                };
            }

            const shopPages = split(ShopItems, 5);
            const pageAmount = shopPages.length;

            paginate(channel, author.id, pageAmount, (page, hasMultiplePages) => {
                return getShopEmbed(
                    shopPages[page],
                    hasMultiplePages ? `Shop (Page ${page + 1} of ${pageAmount})` : "Shop"
                );
            });
        }
    }
});

export const BuyCommand = new NamedCommand({
    description: "Buys an item from the shop.",
    usage: "<item>",
    async run({guild, channel, args, message, author}) {
        if (isAuthorized(guild, channel)) {
            let found = false;

            let amount = 1; // The amount the user is buying.

            // For now, no shop items support being bought multiple times. Uncomment these 2 lines when it's supported/needed.
            //if (/\d+/g.test(args[args.length - 1]))
            //amount = parseInt(args.pop());

            let requested = args.join(" "); // The item the user is buying.

            for (let item of ShopItems) {
                if (item.usage === requested) {
                    const user = Storage.getUser(author.id);
                    const cost = item.cost * amount;

                    if (cost > user.money) {
                        channel.send("Not enough Mons!");
                    } else {
                        user.money -= cost;
                        Storage.save();
                        item.run(message, cost, amount);
                    }

                    found = true;
                    break;
                }
            }

            if (!found) channel.send(`There's no item in the shop that goes by \`${requested}\`!`);
        }
    }
});
