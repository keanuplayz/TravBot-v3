import {client} from "../../../index";

// Calculate and match the list of emotes against the queried emote, then sort the IDs based on calculated priority.
export function queryClosestEmoteByName(query: string) {
    const priorityTable: {[id: string]: number} = {};

    for (const emote of client.emojis.cache.values()) priorityTable[emote.id] = compareEmoteNames(emote.name, query);

    const resultingIDs = Object.keys(priorityTable).sort((a, b) => priorityTable[b] - priorityTable[a]);
    return client.emojis.cache.get(resultingIDs[0])!;
}

// Compare an emote's name against a query to see how alike the two are. The higher the number, the closer they are. Takes into account length and capitalization.
function compareEmoteNames(emote: string, query: string) {
    let likeness = -Math.abs(emote.length - query.length);
    const isQueryLonger = query.length > emote.length;

    // Loop through all indexes that the two strings share then compare each letter.
    for (let i = 0; i < (isQueryLonger ? emote.length : query.length); i++) {
        const c = emote[i];
        const q = query[i];

        // If they're the exact same character
        if (c === q) likeness += 1.5;
        // If the emote is uppercase but the query is lowercase
        else if (c === q.toUpperCase()) likeness += 1;
        // If the emote is lowercase but the query is uppercase
        else if (c === q.toLowerCase()) likeness += 0.5;
        // Otherwise, if they're different characters, don't add anything (this isn't a spellchecker)
    }

    return likeness;
}
