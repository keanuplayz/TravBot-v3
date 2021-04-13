import {GuildEmoji, MessageEmbed, User} from "discord.js";
import {NamedCommand, RestCommand, paginate, SendFunction} from "onion-lasers";
import {split} from "../../lib";
import vm from "vm";

const REGEX_TIMEOUT_MS = 1000;

export default new NamedCommand({
    description: "Lists all emotes the bot has in it's registry,",
    usage: "<regex pattern> (-flags)",
    async run({send, author, client}) {
        displayEmoteList(client.emojis.cache.array(), send, author);
    },
    any: new RestCommand({
        description:
            "Filters emotes by via a regular expression. Flags can be added by adding a dash at the end. For example, to do a case-insensitive search, do %prefix%lsemotes somepattern -i",
        async run({send, author, client, args}) {
            // If a guild ID is provided, filter all emotes by that guild (but only if there aren't any arguments afterward)
            if (args.length === 1 && /^\d{17,}$/.test(args[0])) {
                const guildID: string = args[0];

                displayEmoteList(
                    client.emojis.cache.filter((emote) => emote.guild.id === guildID).array(),
                    send,
                    author
                );
            } else {
                // Otherwise, search via a regex pattern
                let flags: string | undefined = undefined;

                if (/^-[dgimsuy]{1,7}$/.test(args[args.length - 1])) {
                    flags = args.pop().substring(1);
                }

                let emoteCollection = client.emojis.cache.array();
                // Creates a sandbox to stop a regular expression if it takes too much time to search.
                // To avoid passing in a giant data structure, I'll just pass in the structure {[id: string]: [name: string]}.
                let emotes = new Map<string, string>();

                for (const emote of emoteCollection) {
                    emotes.set(emote.id, emote.name);
                }

                // The result will be sandbox.emotes because it'll be modified in-place.
                const sandbox = {
                    regex: new RegExp(args.join(" "), flags),
                    emotes
                };
                const context = vm.createContext(sandbox);

                if (vm.isContext(sandbox)) {
                    // Restrict an entire query to the timeout specified.
                    try {
                        const script = new vm.Script(
                            "for(const [id, name] of emotes.entries()) if(!regex.test(name)) emotes.delete(id);"
                        );
                        script.runInContext(context, {timeout: REGEX_TIMEOUT_MS});
                        emotes = sandbox.emotes;
                        emoteCollection = emoteCollection.filter((emote) => emotes.has(emote.id)); // Only allow emotes that haven't been deleted.
                        displayEmoteList(emoteCollection, send, author);
                    } catch (error) {
                        if (error.code === "ERR_SCRIPT_EXECUTION_TIMEOUT") {
                            send(
                                `The regular expression you entered exceeded the time limit of ${REGEX_TIMEOUT_MS} milliseconds.`
                            );
                        } else {
                            throw new Error(error);
                        }
                    }
                } else {
                    send("Failed to initialize sandbox.");
                }
            }
        }
    })
});

async function displayEmoteList(emotes: GuildEmoji[], send: SendFunction, author: User) {
    emotes.sort((a, b) => {
        const first = a.name.toLowerCase();
        const second = b.name.toLowerCase();

        if (first > second) return 1;
        else if (first < second) return -1;
        else return 0;
    });
    const sections = split(emotes, 20);
    const pages = sections.length;
    const embed = new MessageEmbed().setColor("AQUA");

    // Gather the first page (if it even exists, which it might not if there no valid emotes appear)
    if (pages > 0) {
        paginate(send, author.id, pages, (page, hasMultiplePages) => {
            embed.setTitle(hasMultiplePages ? `**Emotes** (Page ${page + 1} of ${pages})` : "**Emotes**");

            let desc = "";
            for (const emote of sections[page]) {
                desc += `${emote} ${emote.name} (**${emote.guild.name}**)\n`;
            }
            embed.setDescription(desc);

            return embed;
        });
    } else {
        send("No valid emotes found by that query.");
    }
}
