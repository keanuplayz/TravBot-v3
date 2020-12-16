import {Message} from "discord.js";
import $ from "../../../core/lib";

export interface ShopItem {
    cost: number;
    title: string;
    description: string;
    usage: string;
    run(message: Message, cost: number, amount: number): void;
}

export const ShopItems: ShopItem[] = [
    {
        cost: 1,
        title: "Hug",
        description: "Hug Monika.",
        usage: "hug",
        run(message, cost) {
            message.channel.send(`Transaction of ${cost} Mon completed successfully. <@394808963356688394>`);
        }
    },
    {
        cost: 2,
        title: "Handholding",
        description: "Hold Monika's hand.",
        usage: "handhold",
        run(message, cost) {
            message.channel.send(`Transaction of ${cost} Mons completed successfully. <@394808963356688394>`);
        }
    },
    {
        cost: 1,
        title: "Cute",
        description: "Calls Monika cute.",
        usage: "cute",
        run(message) {
            message.channel.send("<:MoniCheeseBlushRed:637513137083383826>");
        }
    },
    {
        cost: 3,
        title: "Laser Bridge",
        description: "Buys what is technically a laser bridge.",
        usage: "laser bridge",
        run(message) {
            message.channel.send($(lines).random(), {
                files: [
                    {
                        attachment:
                            "https://raw.githubusercontent.com/keanuplayz/TravBot/dev/assets/TheUltimateLaser.gif"
                    }
                ]
            });
        }
    }
];

const lines = [
    "It's technically a laser bridge. No refunds.",
    "You want a laser bridge? You got one!",
    "Now what'd they say about building bridges... Oh wait, looks like I nuked the planet again. Whoops!",
    "I saw this redhead the other day who was so excited to buy what I was selling. Needless to say, she was not very happy with me afterward.",
    "Sorry, but you'll have to wait until the Laser Bridge Builder leaves early access.",
    "Thank you for your purchase! For you see, this is the legendary laser of obliteration that has been defended and preserved for countless generations!",
    "They say that a certain troll dwells under this laser bridge, waiting for an unlucky person to fall for th- I mean- Thank you for your purchase!",
    "Buy?! Hah! How about our new rental service for just under $9.99 a month? But wait, there's more! For just $99.99, you can rent this laser bridge for an entire year and save 16.67% as opposed to renting it monthly!",
    "Good choice. Owning a laser bridge is the penultimate experience that all true seekers strive for!",
    'I can already imagine the reviews...\n"9/10 needs more lasers"'
];
