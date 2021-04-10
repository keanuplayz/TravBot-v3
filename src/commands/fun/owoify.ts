import {Command, NamedCommand} from "../../core";
import {getContent} from "../../lib";
import {URL} from "url";

export default new NamedCommand({
    description: "OwO-ifies the input.",
    async run({send, message, channel, guild, author, member, client, args}) {
        let url = new URL(`https://nekos.life/api/v2/owoify?text=${args.join(" ")}`);
        const content = (await getContent(url.toString())) as any; // Apparently, the object in question is {owo: string}.
        send(content.owo);
    }
});
