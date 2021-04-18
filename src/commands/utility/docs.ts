import {NamedCommand, RestCommand} from "onion-lasers";
import {URL} from "url";
import {getContent} from "../../lib";

export default new NamedCommand({
    description: "Provides you with info from the Discord.JS docs.",
    run: "You need to specify a term to query the docs with.",
    any: new RestCommand({
        description: "What to query the docs with.",
        async run({send, author, args}) {
            var queryString = args[0];
            let url = new URL(`https://djsdocs.sorta.moe/v2/embed?src=master&q=${queryString}`);
            const content = await getContent(url.toString());
            const msg = await send({embed: content});
            const react = await msg.react("❌");

            const collector = msg.createReactionCollector(
                (reaction, user) => {
                    if (user.id === author.id && reaction.emoji.name === "❌") msg.delete();
                    return false;
                },
                {time: 60000}
            );

            collector.on("end", () => {
                if (!msg.deleted) react.users.remove(msg.author);
            });
        }
    })
});
