import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {NamedCommand, RestCommand} from "onion-lasers";
const vaporwave = (() => {
    const map = new Map<string, string>();
    const vaporwave =
        "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ！＂＃＄％＆＇（）＊＋，－．／０１２３４５６７８９：；＜＝＞？＠［＼］＾＿｀｛｜｝～ ";
    const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!\"#$%&'()*+,-./0123456789:;<=>?@[\\]^_`{|}~ ";
    if (vaporwave.length !== normal.length) console.error("Vaporwave text failed to load properly!");
    for (let i = 0; i < vaporwave.length; i++) map.set(normal[i], vaporwave[i]);
    return map;
})();

function getVaporwaveText(text: string): string {
    let output = "";

    for (const c of text) {
        const transformed = vaporwave.get(c);
        if (transformed) output += transformed;
    }

    return output;
}

export const header = new SlashCommandBuilder()
    .setDescription("Transforms your text into ｖａｐｏｒｗａｖｅ.")
    .addStringOption((option) =>
        option.setName("text").setDescription("The text you want to ｖａｐｏｒｗａｖｅ.").setRequired(true)
    );

export async function handler(interaction: CommandInteraction) {
    const {options} = interaction;
    const response = options.getString("text", true);
    await interaction.reply(getVaporwaveText(response));
}
export default new NamedCommand({
    description: "Transforms your text into ｖａｐｏｒｗａｖｅ.",
    run: "You need to enter some text!",
    any: new RestCommand({
        async run({send, combined}) {
            const text = getVaporwaveText(combined);
            if (text !== "") send(text);
            else send("Make sure to enter at least one valid character.");
        }
    })
});
