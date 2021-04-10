import {Command, NamedCommand, RestCommand} from "../../core";
import {getContent} from "../../lib";
import {URL} from "url";

export default new NamedCommand({
    description: "OwO-ifies the input.",
    run: "You need to specify some text to owoify.",
    any: new RestCommand({
        async run({send, message, channel, guild, author, member, client, args, combined}) {
            let url = new URL(`https://nekos.life/api/v2/owoify?text=${combined}`);
            const content = (await getContent(url.toString())) as any; // Apparently, the object in question is {owo: string}.
            send(content.owo);
        }
    })
});
