import {URL} from "url";
import {Command, NamedCommand} from "onion-lasers";
import {getContent} from "../../lib";

const endpoints: {sfw: {[key: string]: string}} = {
    sfw: {
        tickle: "/img/tickle",
        slap: "/img/slap",
        poke: "/img/poke",
        pat: "/img/pat",
        neko: "/img/neko",
        meow: "/img/meow",
        lizard: "/img/lizard",
        kiss: "/img/kiss",
        hug: "/img/hug",
        foxGirl: "/img/fox_girl",
        feed: "/img/feed",
        cuddle: "/img/cuddle",
        why: "/why",
        catText: "/cat",
        fact: "/fact",
        nekoGif: "/img/ngif",
        kemonomimi: "/img/kemonomimi",
        holo: "/img/holo",
        smug: "/img/smug",
        baka: "/img/baka",
        woof: "/img/woof",
        spoiler: "/spoiler",
        wallpaper: "/img/wallpaper",
        goose: "/img/goose",
        gecg: "/img/gecg",
        avatar: "/img/avatar",
        waifu: "/img/waifu"
    }
};

export default new NamedCommand({
    description: "Provides you with a random image with the selected argument.",
    async run({send}) {
        send(`Please provide an image type. Available arguments:\n\`[${Object.keys(endpoints.sfw).join(", ")}]\`.`);
    },
    any: new Command({
        description: "Image type to send.",
        async run({send, args}) {
            const arg = args[0];
            if (!(arg in endpoints.sfw)) return send("Couldn't find that endpoint!");
            let url = new URL(`https://nekos.life/api/v2${endpoints.sfw[arg]}`);
            const content = await getContent(url.toString());
            return send(content.url);
        }
    })
});
