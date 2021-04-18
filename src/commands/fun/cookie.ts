import {User} from "discord.js";
import {Command, NamedCommand} from "onion-lasers";
import {random, parseVars} from "../../lib";

const cookies = [
    `has given %target% a chocolate chip cookie!`,
    `has given %target% a soft homemade oatmeal cookie!`,
    `has given %target% a plain, dry, old cookie. It was the last one in the bag. Gross.`,
    `gives %target% a sugar cookie. What, no frosting and sprinkles? 0/10 would not touch.`,
    `gives %target% a chocolate chip cookie. Oh wait, those are raisins. Bleck!`,
    `gives %target% an enormous cookie. Poking it gives you more cookies. Weird.`,
    `gives %target% a fortune cookie. It reads "Why aren't you working on any projects?"`,
    `gives %target% a fortune cookie. It reads "Give that special someone a compliment"`,
    `gives %target% a fortune cookie. It reads "Take a risk!"`,
    `gives %target% a fortune cookie. It reads "Go outside."`,
    `gives %target% a fortune cookie. It reads "Don't forget to eat your veggies!"`,
    `gives %target% a fortune cookie. It reads "Do you even lift?"`,
    `gives %target% a fortune cookie. It reads "m808 pls"`,
    `gives %target% a fortune cookie. It reads "If you move your hips, you'll get all the ladies."`,
    `gives %target% a fortune cookie. It reads "I love you."`,
    `gives %target% a Golden Cookie. You can't eat it because it is made of gold. Dammit.`,
    `gives %target% an Oreo cookie with a glass of milk!`,
    `gives %target% a rainbow cookie made with love :heart:`,
    `gives %target% an old cookie that was left out in the rain, it's moldy.`,
    `bakes %target% fresh cookies, it smells amazing.`
];

export default new NamedCommand({
    description: "Gives specified user a cookie.",
    usage: "['all'/@user]",
    run: ":cookie: Here's a cookie!",
    subcommands: {
        all: new NamedCommand({
            async run({send, author}) {
                send(`${author} gave everybody a cookie!`);
            }
        })
    },
    id: "user",
    user: new Command({
        description: "User to give cookie to.",
        async run({send, author, args}) {
            const mention: User = args[0];

            if (mention.id == author.id) return send("You can't give yourself cookies!");

            return send(
                `:cookie: ${author} ${parseVars(random(cookies), {
                    target: mention.toString()
                })}`
            );
        }
    })
});
