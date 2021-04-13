import {NamedCommand, RestCommand} from "onion-lasers";

const letters: {[letter: string]: string[]} = {
    a: "aáàảãạâấầẩẫậăắằẳẵặ".split(""),
    e: "eéèẻẽẹêếềểễệ".split(""),
    i: "iíìỉĩị".split(""),
    o: "oóòỏõọôốồổỗộơớờởỡợ".split(""),
    u: "uúùủũụưứừửữự".split(""),
    y: "yýỳỷỹỵ".split(""),
    d: "dđ".split("")
};

function transform(str: string) {
    let out = "";

    for (const c of str) {
        const token = c.toLowerCase();
        const isUpperCase = token !== c;

        if (token in letters) {
            const set = letters[token];
            const add = set[Math.floor(Math.random() * set.length)];
            out += isUpperCase ? add.toUpperCase() : add;
        } else {
            out += c;
        }
    }

    return out;
}

let phrase = "I have no currently set phrase!";

export default new NamedCommand({
    description: "Transforms your text into ｖｉｅｔｎａｍｅｓｅ.",
    usage: "([text])",
    async run({send, author}) {
        const msg = await send(transform(phrase));
        msg.createReactionCollector(
            (reaction, user) => {
                if (user.id === author.id && reaction.emoji.name === "❌") msg.delete();
                return false;
            },
            {time: 60000}
        );
    },
    any: new RestCommand({
        async run({send, author, combined}) {
            phrase = combined;
            const msg = await send(transform(phrase));
            msg.createReactionCollector(
                (reaction, user) => {
                    if (user.id === author.id && reaction.emoji.name === "❌") msg.delete();
                    return false;
                },
                {time: 60000}
            );
        }
    })
});
