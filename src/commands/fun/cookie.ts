import Command from "../../core/command";
import {CommonLibrary} from "../../core/lib";

export default new Command({
    description: "Gives specified user a cookie.",
    usage: "['all'/@user]",
    run: ":cookie: Here's a cookie!",
    any: new Command({
        async run($: CommonLibrary): Promise<any> {
            if ($.args[0] == "all")
                return $.channel.send(`${$.author} gave everybody a cookie!`);
        }
    }),
    user: new Command({
        description: "User to give cookie to.",
        async run($: CommonLibrary): Promise<any> {
            const sender = $.author;
            const mention = $.message.mentions.users.first();

            if (!mention) return;

            const cookies = [
                `has given <@${mention.id}> a chocolate chip cookie!`,
                `has given <@${mention.id}> a soft homemade oatmeal cookie!`,
                `has given <@${mention.id}> a plain, dry, old cookie. It was the last one in the bag. Gross.`,
                `gives <@${mention.id}> a sugar cookie. What, no frosting and sprinkles? 0/10 would not touch.`,
                `gives <@${mention.id}> a chocolate chip cookie. Oh wait, those are raisins. Bleck!`,
                `gives <@${mention.id}> an enormous cookie. Poking it gives you more cookies. Weird.`,
                `gives <@${mention.id}> a fortune cookie. It reads "Why aren't you working on any projects?"`,
                `gives <@${mention.id}> a fortune cookie. It reads "Give that special someone a compliment"`,
                `gives <@${mention.id}> a fortune cookie. It reads "Take a risk!"`,
                `gives <@${mention.id}> a fortune cookie. It reads "Go outside."`,
                `gives <@${mention.id}> a fortune cookie. It reads "Don't forget to eat your veggies!"`,
                `gives <@${mention.id}> a fortune cookie. It reads "Do you even lift?"`,
                `gives <@${mention.id}> a fortune cookie. It reads "m808 pls"`,
                `gives <@${mention.id}> a fortune cookie. It reads "If you move your hips, you'll get all the ladies."`,
                `gives <@${mention.id}> a fortune cookie. It reads "I love you."`,
                `gives <@${mention.id}> a Golden Cookie. You can't eat it because it is made of gold. Dammit.`,
                `gives <@${mention.id}> an Oreo cookie with a glass of milk!`,
                `gives <@${mention.id}> a rainbow cookie made with love :heart:`,
                `gives <@${mention.id}> an old cookie that was left out in the rain, it's moldy.`,
                `bakes <@${mention.id}> fresh cookies, it smells amazing.`
            ];

            if (mention.id == sender.id)
                return $.channel.send("You can't give yourself cookies!");

            $.channel.send(
                `:cookie: <@${sender.id}> ` +
                    cookies[Math.floor(Math.random() * cookies.length)]
            );
        }
    })
});
