// Library for pure functions

/**
 * Pluralises a word and chooses a suffix attached to the root provided.
 * - pluralise("credit", "s") = credit/credits
 * - pluralise("part", "ies", "y") = party/parties
 * - pluralise("sheep") = sheep
 */
export function pluralise(value: number, word: string, plural = "", singular = "", excludeNumber = false): string {
    let result = excludeNumber ? "" : `${value} `;

    if (value === 1) result += word + singular;
    else result += word + plural;

    return result;
}

/**
 * Pluralises a word for changes.
 * - (-1).pluraliseSigned() = '-1 credits'
 * - (0).pluraliseSigned() = '+0 credits'
 * - (1).pluraliseSigned() = '+1 credit'
 */
export function pluraliseSigned(
    value: number,
    word: string,
    plural = "",
    singular = "",
    excludeNumber = false
): string {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${pluralise(value, word, plural, singular, excludeNumber)}`;
}

export function replaceAll(text: string, before: string, after: string): string {
    while (text.indexOf(before) !== -1) text = text.replace(before, after);
    return text;
}

export function toTitleCase(text: string): string {
    return text.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/** Returns a random element from this array. */
export function random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Splits up this array into a specified length.
 * `$([1,2,3,4,5,6,7,8,9,10]).split(3)` = `[[1,2,3],[4,5,6],[7,8,9],[10]]`
 */
export function split<T>(array: T[], lengthOfEachSection: number): T[][] {
    const amountOfSections = Math.ceil(array.length / lengthOfEachSection);
    const sections = new Array<T[]>(amountOfSections);

    for (let index = 0; index < amountOfSections; index++)
        sections[index] = array.slice(index * lengthOfEachSection, (index + 1) * lengthOfEachSection);

    return sections;
}
