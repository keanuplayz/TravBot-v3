import {strict as assert} from "assert";
import {NumberWrapper, StringWrapper, ArrayWrapper} from "../src/core/wrappers";

// I can't figure out a way to run the test suite while running the bot.
describe("Wrappers", () => {
	describe("NumberWrapper", () => {
		describe("#pluralise()", () => {
			it('should return "5 credits"', () => {
				assert.equal(new NumberWrapper(5).pluralise("credit", "s"), "5 credits");
			})
			
			it('should return "1 credit"', () => {
				assert.equal(new NumberWrapper(1).pluralise("credit", "s"), "1 credit");
			})
			
			it('should return "-1 credits"', () => {
				assert.equal(new NumberWrapper(-1).pluralise("credit", "s"), "-1 credits");
			})
			
			it('should be able to work with a plural suffix', () => {
				assert.equal(new NumberWrapper(2).pluralise("part", "ies", "y"), "2 parties");
			})
			
			it('should be able to work with a singular suffix', () => {
				assert.equal(new NumberWrapper(1).pluralise("part", "ies", "y"), "1 party");
			})
			
			it('should be able to exclude the number', () => {
				assert.equal(new NumberWrapper(1).pluralise("credit", "s", "", true), "credit");
			})
		})
		
		describe("#pluraliseSigned()", () => {
			it('should return "-1 credits"', () => {
				assert.equal(new NumberWrapper(-1).pluraliseSigned("credit", "s"), "-1 credits");
			})
			
			it('should return "+0 credits"', () => {
				assert.equal(new NumberWrapper(0).pluraliseSigned("credit", "s"), "+0 credits");
			})
			
			it('should return "+1 credit"', () => {
				assert.equal(new NumberWrapper(1).pluraliseSigned("credit", "s"), "+1 credit");
			})
		})
	})
	
	describe("StringWrapper", () => {
		describe("#replaceAll()", () => {
			it('should convert "test" to "zesz"', () => {
				assert.equal(new StringWrapper("test").replaceAll('t', 'z'), "zesz");
			})
		})
		
		describe("#toTitleCase()", () => {
			it('should capitalize the first letter of each word', () => {
				assert.equal(new StringWrapper("yeetus deletus find salvation from jesus").toTitleCase(), "Yeetus Deletus Find Salvation From Jesus");
			})
		})
	})
	
	describe("ArrayWrapper", () => {
		describe("#split()", () => {
			it('should split [1,2,3,4,5,6,7,8,9,10] into [[1,2,3],[4,5,6],[7,8,9],[10]]', () => {
				assert.deepEqual(new ArrayWrapper([1,2,3,4,5,6,7,8,9,10]).split(3), [[1,2,3],[4,5,6],[7,8,9],[10]]);
			})
		})
	})
})