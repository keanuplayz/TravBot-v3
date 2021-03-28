import {GuildEmoji} from "discord.js";
import {MessageEmbed} from "discord.js";
import Command from "../../core/command";
import {CommonLibrary} from "../../core/lib";

export default new Command({
    description: "Lists all emotes the bot has in it's registry,",
    usage: "<regex pattern> (-flags)",
    async run($: CommonLibrary): Promise<any> {
        displayEmoteList($, $.client.emojis.cache.array());
    },
    any: new Command({
        description:
            "Filters emotes by via a regular expression. Flags can be added by adding a dash at the end. For example, to do a case-insensitive search, do %prefix%lsemotes somepattern -i",
        async run($: CommonLibrary): Promise<any> {
            // If a guild ID is provided, filter all emotes by that guild (but only if there aren't any arguments afterward)
            if ($.args.length === 1 && /^\d{17,19}$/.test($.args[0])) {
                const guildID: string = $.args[0];

                displayEmoteList($, $.client.emojis.cache.filter((emote) => emote.guild.id === guildID).array());
            } else {
                // Otherwise, search via a regex pattern
                let flags: string | undefined = undefined;

                if (/^-[dgimsuy]{1,7}$/.test($.args[$.args.length - 1])) {
                    flags = $.args.pop().substring(1);
                }

                displayEmoteList(
                    $,
                    $.client.emojis.cache
                        .filter((emote) => new RegExp($.args.join(" "), flags).test(emote.name))
                        .array()
                );
            }
        }
    })
});

async function displayEmoteList($: CommonLibrary, emotes: GuildEmoji[]) {
    emotes.sort((a, b) => {
        const first = a.name.toLowerCase();
        const second = b.name.toLowerCase();

        if (first > second) return 1;
        else if (first < second) return -1;
        else return 0;
    });
    const sections = $(emotes).split(20);
    const pages = sections.length;
    const embed = new MessageEmbed().setTitle("**Emotes**").setColor("AQUA");
    let desc = "";

    // Gather the first page (if it even exists, which it might not if there no valid emotes appear)
    if (pages > 0) {
        for (const emote of sections[0]) {
            desc += `${emote} ${emote.name} (**${emote.guild.name}**)\n`;
        }

        embed.setDescription(desc);

        if (pages > 1) {
            embed.setTitle(`**Emotes** (Page 1 of ${pages})`);
            const msg = await $.channel.send({embed});

            $.paginate(msg, $.author.id, pages, (page) => {
                let desc = "";
                for (const emote of sections[page]) {
                    desc += `${emote} ${emote.name} (**${emote.guild.name}**)\n`;
                }
                embed.setTitle(`**Emotes** (Page ${page + 1} of ${pages})`);
                embed.setDescription(desc);
                msg.edit(embed);
            });
        } else {
            await $.channel.send({embed});
        }
    } else {
        $.channel.send("No valid emotes found by that query.");
    }
}
