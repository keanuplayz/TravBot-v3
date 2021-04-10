jest.useFakeTimers();
import {strict as assert} from "assert";
import {extractFirstMessageLink} from "./messageEmbed";

describe("modules/messageEmbed", () => {
    describe("extractFirstMessageLink()", () => {
        const guildID = "802906483866631183";
        const channelID = "681747101169682147";
        const messageID = "996363055050949479";
        const post = `channels/${guildID}/${channelID}/${messageID}`;
        const commonUrl = `https://discord.com/${post}`;
        const combined = [guildID, channelID, messageID];

        it("should return work and extract correctly on an isolated link", () => {
            const result = extractFirstMessageLink(commonUrl);
            assert.deepStrictEqual(result, combined);
        });

        it("should return work and extract correctly on a link within a message", () => {
            const result = extractFirstMessageLink(`sample text${commonUrl}, more sample text`);
            assert.deepStrictEqual(result, combined);
        });

        it('should return null on "!link"', () => {
            const result = extractFirstMessageLink(`just some !${commonUrl} text`);
            assert.strictEqual(result, null);
        });

        it('should return null on "<link>"', () => {
            const result = extractFirstMessageLink(`just some <${commonUrl}> text`);
            assert.strictEqual(result, null);
        });

        it('should return work and extract correctly on "<link"', () => {
            const result = extractFirstMessageLink(`just some <${commonUrl} text`);
            assert.deepStrictEqual(result, combined);
        });

        it('should return work and extract correctly on "link>"', () => {
            const result = extractFirstMessageLink(`just some ${commonUrl}> text`);
            assert.deepStrictEqual(result, combined);
        });

        it("should return work and extract correctly on a canary link", () => {
            const result = extractFirstMessageLink(`https://canary.discord.com/${post}`);
            assert.deepStrictEqual(result, combined);
        });
    });
});
