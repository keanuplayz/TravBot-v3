/// @ts-nocheck
import {URL} from "url";
import FileManager from "../../core/storage";
import Command from "../../core/command";
import {CommonLibrary, getContent} from "../../core/lib";

const endpoints = FileManager.read("endpoints");

export default new Command({
    description: "Provides you with a random image with the selected argument.",
    async run($: CommonLibrary): Promise<any> {
        console.log(endpoints.sfw);
        $.channel.send(
            `Please provide an image type. Available arguments:\n\`[${Object.keys(
                endpoints.sfw
            ).join(", ")}]\`.`
        );
    },
    any: new Command({
        description: "Image type to send.",
        async run($: CommonLibrary): Promise<any> {
            if (!($.args[0] in endpoints.sfw))
                return $.channel.send("Couldn't find that endpoint!");

            let baseURL = "https://nekos.life/api/v2";
            let url = new URL(`${baseURL}${endpoints.sfw[$.args[0]]}`);
            const content = await getContent(url.toString());
            $.channel.send(content.url);
        }
    })
});
