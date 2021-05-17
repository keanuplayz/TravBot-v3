// This is a nightmarishly bad way to handle module patches... but oh well, it's on the unstable branch for a reason.
const fs = require("fs");
const DECLARATION_FILE = "node_modules/discord.js/typings/index.d.ts";

fs.readFile(DECLARATION_FILE, "utf-8", (err, data) => {
    if (err) console.error(err);
    else {
        const declaration = data.split(/\r?\n/);

        // "discord-api-types/v8" is apparently not found so just ignore it to get the typings to work.
        for (let i = 0; i < declaration.length; i++) {
            const line = declaration[i];

            if (line.includes("@ts-ignore")) {
                break;
            } else if (line.includes("discord-api-types/v8")) {
                declaration.splice(i, 0, "// @ts-ignore");
                fs.writeFile(DECLARATION_FILE, declaration.join("\n"), () => {});
                break;
            }
        }
    }
});
