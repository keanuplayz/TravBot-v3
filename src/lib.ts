// Library for pure functions
import {get} from "https";
import FileManager from "./modules/storage";

/**
 * Splits a command by spaces while accounting for quotes which capture string arguments.
 * - `\"` = `"`
 * - `\\` = `\`
 */
export function parseArgs(line: string): string[] {
    let result = [];
    let selection = "";
    let inString = false;
    let isEscaped = false;

    for (let c of line) {
        if (isEscaped) {
            if (['"', "\\"].includes(c)) selection += c;
            else selection += "\\" + c;

            isEscaped = false;
        } else if (c === "\\") isEscaped = true;
        else if (c === '"') inString = !inString;
        else if (c === " " && !inString) {
            result.push(selection);
            selection = "";
        } else selection += c;
    }

    if (selection.length > 0) result.push(selection);

    return result;
}

/**
 * Allows you to store a template string with variable markers and parse it later.
 * - Use `%name%` for variables
 * - `%%` = `%`
 * - If the invalid token is null/undefined, nothing is changed.
 */
export function parseVars(
    line: string,
    definitions: {[key: string]: string},
    delimiter = "%",
    invalid: string | null = ""
): string {
    let result = "";
    let inVariable = false;
    let token = "";

    for (const c of line) {
        if (c === delimiter) {
            if (inVariable) {
                if (token === "") result += delimiter;
                else {
                    if (token in definitions) result += definitions[token];
                    else if (invalid === null) result += `%${token}%`;
                    else result += invalid;

                    token = "";
                }
            }

            inVariable = !inVariable;
        } else if (inVariable) token += c;
        else result += c;
    }

    return result;
}

export function parseVarsCallback(line: string, callback: (variable: string) => string, delimiter = "%"): string {
    let result = "";
    let inVariable = false;
    let token = "";

    for (const c of line) {
        if (c === delimiter) {
            if (inVariable) {
                if (token === "") result += delimiter;
                else {
                    result += callback(token);
                    token = "";
                }
            }

            inVariable = !inVariable;
        } else if (inVariable) token += c;
        else result += c;
    }

    return result;
}

export function isType(value: any, type: any): boolean {
    if (value === undefined && type === undefined) return true;
    else if (value === null && type === null) return true;
    else return value !== undefined && value !== null && value.constructor === type;
}

/**
 * Checks a value to see if it matches the fallback's type, otherwise returns the fallback.
 * For the purposes of the templates system, this function will only check array types, objects should be checked under their own type (as you'd do anyway with something like a User object).
 * If at any point the value doesn't match the data structure provided, the fallback is returned.
 * Warning: Type checking is based on the fallback's type. Be sure that the "type" parameter is accurate to this!
 */
export function select<T>(value: any, fallback: T, type: Function, isArray = false): T {
    if (isArray && isType(value, Array)) {
        for (let item of value) if (!isType(item, type)) return fallback;
        return value;
    } else {
        if (isType(value, type)) return value;
        else return fallback;
    }
}

export function clean(text: unknown) {
    if (typeof text === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else return text;
}

export function trimArray(arr: any, maxLen = 10) {
    if (arr.length > maxLen) {
        const len = arr.length - maxLen;
        arr = arr.slice(0, maxLen);
        arr.push(`${len} more...`);
    }
    return arr;
}

export function formatBytes(bytes: any) {
    if (bytes === 0) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

export function getContent(url: string): Promise<{url: string}> {
    return new Promise((resolve, reject) => {
        get(url, (res) => {
            const {statusCode} = res;
            if (statusCode !== 200) {
                res.resume();
                reject(`Request failed. Status code: ${statusCode}`);
            }
            res.setEncoding("utf8");
            let rawData = "";
            res.on("data", (chunk: string) => {
                rawData += chunk;
            });
            res.on("end", () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } catch (e) {
                    let errorMessage = "Something went wrong! We don't know what, though...";
                    if (e instanceof Error) {
                        errorMessage = e.message;
                    }
                    reject(`Error: ${errorMessage}`);
                }
            });
        }).on("error", (err: {message: any}) => {
            reject(`Error: ${err.message}`);
        });
    });
}

export interface GenericJSON {
    [key: string]: any;
}

// In order to define a file to write to while also not:
// - Using the delete operator (which doesn't work on properties which cannot be undefined)
// - Assigning it first then using Object.defineProperty (which raises a flag on CodeQL)
// A non-null assertion is used on the class property to say that it'll definitely be assigned.
export abstract class GenericStructure {
    private __meta__!: string;

    constructor(tag?: string) {
        Object.defineProperty(this, "__meta__", {
            value: tag || "generic",
            enumerable: false
        });
    }

    public save(asynchronous = true) {
        FileManager.write(this.__meta__, this, asynchronous);
    }
}

// A 50% chance would be "Math.random() < 0.5" because Math.random() can be [0, 1), so to make two equal ranges, you'd need [0, 0.5)U[0.5, 1).
// Similar logic would follow for any other percentage. Math.random() < 1 is always true (100% chance) and Math.random() < 0 is always false (0% chance).
export const Random = {
    num: (min: number, max: number) => Math.random() * (max - min) + min,
    int: (min: number, max: number) => Math.floor(Random.num(min, max)),
    chance: (decimal: number) => Math.random() < decimal,
    sign: (number = 1) => number * (Random.chance(0.5) ? -1 : 1),
    deviation: (base: number, deviation: number) => Random.num(base - deviation, base + deviation)
};

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

/**
 * Utility function to require all possible cases to be handled at compile time.
 *
 * To use this function, place it in the "default" case of a switch statement or the "else" statement of an if-else branch.
 * If all cases are handled, the variable being tested for should be of type "never", and if it isn't, that means not all cases are handled yet.
 */
export function requireAllCasesHandledFor(variable: never): never {
    throw new Error(`This function should never be called but got the value: ${variable}`);
}
