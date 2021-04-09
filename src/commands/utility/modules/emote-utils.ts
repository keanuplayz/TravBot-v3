import {GuildEmoji} from "discord.js";
import {client} from "../../../index";

// Levenshtein distance coefficients for all transformation types.
// TODO: Investigate what values result in the most optimal matching strategy.
const directMatchWeight = 0.0;
const uppercaseWeight = 0.2;
const lowercaseWeight = 0.5;
const substitutionWeight = 1.0;
const deletionWeight = 1.5;
const insertionWeight = 1.5;

// Maximum Levenshtein distance for an emote to be considered a suitable match candidate.
const maxAcceptedDistance = 3.0;

// Algorithm taken from https://en.wikipedia.org/wiki/Levenshtein_distance#Iterative_with_two_matrix_rows
// Modified for separate handling of uppercasing and lowercasing transformations.
function levenshtein(s: string, t: string): number {
    const m = s.length;
    const n = t.length;

    let v0 = new Array(n + 1);
    let v1 = new Array(n + 1);

    let i, j;

    for (i = 0; i <= n; i++) v0[i] = i;

    for (i = 0; i < m; i++) {
        v1[0] = i + 1;

        for (j = 0; j < n; j++) {
            let r;

            if (s[i] === t[j]) r = directMatchWeight;
            else if (s[i] === t[j].toUpperCase()) r = uppercaseWeight;
            else if (s[i] === t[j].toLowerCase()) r = lowercaseWeight;
            else r = substitutionWeight;

            v1[j + 1] = Math.min(v0[j + 1] + deletionWeight, v1[j] + insertionWeight, v0[j] + r);
        }

        const tmp = v1;
        (v1 = v0), (v0 = tmp);
    }

    return v0[n];
}

function searchSimilarEmotes(query: string): GuildEmoji[] {
    const emoteCandidates: {emote: GuildEmoji; dist: number}[] = [];

    for (const emote of client.emojis.cache.values()) {
        const dist = levenshtein(emote.name, query);
        if (dist <= maxAcceptedDistance) {
            emoteCandidates.push({emote, dist});
        }
    }

    emoteCandidates.sort((b, a) => b.dist - a.dist);
    return emoteCandidates.map((em) => em.emote);
}

const unicodeEmojiRegex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])[\ufe00-\ufe0f]?$/;
const discordEmoteMentionRegex = /^<a?:\w+:\d+>$/;
const emoteNameWithSelectorRegex = /^(.+)~(\d+)$/;

function processEmoteQuery(query: string[], isFormatted: boolean): string[] {
    return query.map((emote) => {
        emote = emote.trim();

        // If the query directly matches a Unicode emoji or a Discord custom emote mention, pass it as-is.
        if (discordEmoteMentionRegex.test(emote) || unicodeEmojiRegex.test(emote)) return emote;

        // If formatted mode is enabled, parse whitespace and newline elements.
        if (isFormatted) {
            if (emote == "-") return " ";
            if (emote == "+") return "\n";
        }

        // Selector number used for disambiguating multiple emotes with same name.
        let selector = 0;

        // If the query has emoteName~123 format, extract the actual name and the selector number.
        const queryWithSelector = emote.match(emoteNameWithSelectorRegex);
        if (queryWithSelector) {
            emote = queryWithSelector[1];
            selector = +queryWithSelector[2];
        }

        // Try to match an emote name directly if the selector is for the closest match.
        if (selector == 0) {
            const directMatchEmote = client.emojis.cache.find((em) => em.name === emote);
            if (directMatchEmote) return directMatchEmote.toString();
        }

        // Find all similar emote candidates within certian threshold and select Nth top one according to the selector.
        const similarEmotes = searchSimilarEmotes(emote);
        if (similarEmotes.length > 0) {
            selector = Math.min(selector, similarEmotes.length - 1);
            return similarEmotes[selector].toString();
        }

        // Return some "missing/invalid emote" indicator.
        return "❓";
    });
}

export const processEmoteQueryArray = (query: string[]): string[] => processEmoteQuery(query, false);
export const processEmoteQueryFormatted = (query: string[]): string => processEmoteQuery(query, true).join("");
