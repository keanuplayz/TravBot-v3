import {NamedCommand, RestCommand} from "onion-lasers";
import {random} from "../../lib";

export default new NamedCommand({
    description: "OwO-ifies the input.",
    run: "You need to specify some text to owoify.",
    any: new RestCommand({
        async run({send, combined}) {
            // Copied from <https://github.com/Nekos-life/neko-website/blob/78b2532de2d91375d6de45e4446fc766ba169472/app.py#L78-L87>.
            const faces = ["owo", "UwU", ">w<", "^w^"];
            const owoified = combined
                .replace(/[rl]/g, "w")
                .replace(/[RL]/g, "W")
                .replace(/ove/g, "uv")
                .replace(/n/g, "ny")
                .replace(/N/g, "NY")
                .replace(/\!/g, ` ${random(faces)} `);
            send(owoified);
        }
    })
});
