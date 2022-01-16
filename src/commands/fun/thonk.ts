import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
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

export const header = new SlashCommandBuilder()
    .setDescription("Transforms your text into ｖｉｅｔｎａｍｅｓｅ.")
    .addStringOption((option) =>
        option.setName("text").setDescription("The text you want to transform").setRequired(true)
    );

export async function handler(interaction: CommandInteraction) {
    const {options} = interaction;
    const response = options.getString("text", true);

    interaction.reply(transform(response));
    // You might notice the remove message code is missing here. It's because reactions collectors are
    //not a thing in interactions. The best alternative would be buttons
}

let phrase = "I have no currently set phrase!";
export default new NamedCommand({
    description: "Transforms your text into ｖｉｅｔｎａｍｅｓｅ.",
    usage: "([text])",
    async run({send, author}) {
        const msg = await send(transform(phrase));
        msg.createReactionCollector({
            filter: (reaction, user) => {
                if (user.id === author.id && reaction.emoji.name === "❌") msg.delete();
                return false;
            },
            time: 60000
        });
    },
    any: new RestCommand({
        async run({send, author, combined}) {
            phrase = combined;
            const msg = await send(transform(phrase));
            msg.createReactionCollector({
                filter: (reaction, user) => {
                    if (user.id === author.id && reaction.emoji.name === "❌") msg.delete();
                    return false;
                },
                time: 60000
            });
        }
    })
});
