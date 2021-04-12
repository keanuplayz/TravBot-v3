import {NamedCommand, RestCommand} from "../../core";
import {URL} from "url";
import {getContent} from "../../lib";

export default new NamedCommand({
    description: "Provides you with info from the Discord.JS docs.",
    run: "You need to specify a term to query the docs with.",
    any: new RestCommand({
        description: "What to query the docs with.",
        async run({send, args}) {
            var queryString = args[0];
            let url = new URL(`https://djsdocs.sorta.moe/v2/embed?src=master&q=${queryString}`);
            const content = await getContent(url.toString());
            return send({embed: content});
        }
    })
});
