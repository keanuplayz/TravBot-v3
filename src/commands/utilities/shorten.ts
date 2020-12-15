import Command from "../../core/command";
import {CommonLibrary} from "../../core/lib";
import * as https from "https";

export default new Command({
    description: "Shortens a given URL.",
    run: "Please provide a URL.",
    any: new Command({
        async run($: CommonLibrary): Promise<any> {
            https.get("https://is.gd/create.php?format=simple&url=" + encodeURIComponent($.args[0]), function (res) {
                var body = "";
                res.on("data", function (chunk) {
                    body += chunk;
                });
                res.on("end", function () {
                    $.channel.send(`<${body}>`);
                });
            });
        }
    })
});
