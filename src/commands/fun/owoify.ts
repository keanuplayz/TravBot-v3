import Command from "../../core/command";
import {getContent} from "../../core/lib";
import {URL} from "url";

export default new Command({
    description: "OwO-ifies the input.",
    async run($) {
        let url = new URL(`https://nekos.life/api/v2/owoify?text=${$.args.join(" ")}`);
        const content = (await getContent(url.toString())) as any; // Apparently, the object in question is {owo: string}.
        $.channel.send(content.owo);
    }
});
