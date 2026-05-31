import { describe, it, expect } from "vitest";
import {
	head,
	last,
	tail,
	init,
	flatten,
	flatMapArr,
	uniq,
	uniqBy,
	chunk,
	zip,
	unzip,
	difference,
	intersection,
	union,
} from "../src/utils/collection";

describe("head", () => {
	it("returns first element", () => expect(head([1, 2, 3])).toBe(1));
	it("returns undefined for empty", () => expect(head([])).toBeUndefined());
	it("works with single element", () => expect(head([42])).toBe(42));
});

describe("last", () => {
	it("returns last element", () => expect(last([1, 2, 3])).toBe(3));
	it("returns undefined for empty", () => expect(last([])).toBeUndefined());
	it("works with single element", () => expect(last([42])).toBe(42));
});

describe("tail", () => {
	it("returns all but first", () => expect(tail([1, 2, 3])).toEqual([2, 3]));
	it("empty for single element", () => expect(tail([1])).toEqual([]));
	it("empty for empty", () => expect(tail([])).toEqual([]));
});

describe("init", () => {
	it("returns all but last", () => expect(init([1, 2, 3])).toEqual([1, 2]));
	it("empty for single element", () => expect(init([1])).toEqual([]));
	it("empty for empty", () => expect(init([])).toEqual([]));
});

describe("flatten", () => {
	it("flattens one level", () =>
		expect(flatten([[1, 2], [3], [4, 5]])).toEqual([1, 2, 3, 4, 5]));
	it("mixed flat and nested", () =>
		expect(flatten([1, [2, 3], 4])).toEqual([1, 2, 3, 4]));
	it("empty", () => expect(flatten([])).toEqual([]));
});

describe("flatMapArr", () => {
	it("maps and flattens", () =>
		expect(flatMapArr([1, 2, 3], (n) => [n, n * 2])).toEqual([1, 2, 2, 4, 3, 6]));
	it("with index", () =>
		expect(flatMapArr(["a", "b"], (s, i) => [s, i])).toEqual(["a", 0, "b", 1]));
	it("empty", () => expect(flatMapArr([], (x: never) => [x])).toEqual([]));
});

describe("uniq", () => {
	it("removes duplicates", () => expect(uniq([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]));
	it("preserves order", () => expect(uniq([3, 1, 2, 1, 3])).toEqual([3, 1, 2]));
	it("empty", () => expect(uniq([])).toEqual([]));
	it("strings", () => expect(uniq(["a", "b", "a"])).toEqual(["a", "b"]));
});

describe("uniqBy", () => {
	it("keeps first of each key", () => {
		const data = [
			{ id: 1, name: "a" },
			{ id: 2, name: "b" },
			{ id: 1, name: "c" },
		];
		expect(uniqBy(data, (x) => x.id)).toEqual([
			{ id: 1, name: "a" },
			{ id: 2, name: "b" },
		]);
	});

	it("by string length", () => {
		expect(uniqBy(["ab", "cd", "e", "fg"], (s) => s.length)).toEqual(["ab", "e"]);
	});
});

describe("chunk", () => {
	it("splits into chunks", () =>
		expect(chunk(2, [1, 2, 3, 4, 5])).toEqual([[1, 2], [3, 4], [5]]));
	it("exact division", () =>
		expect(chunk(3, [1, 2, 3, 4, 5, 6])).toEqual([[1, 2, 3], [4, 5, 6]]));
	it("chunk larger than array", () =>
		expect(chunk(10, [1, 2])).toEqual([[1, 2]]));
	it("empty", () => expect(chunk(3, [])).toEqual([]));
});

describe("zip", () => {
	it("pairs elements", () =>
		expect(zip([1, 2, 3], ["a", "b", "c"])).toEqual([[1, "a"], [2, "b"], [3, "c"]]));
	it("shorter wins", () =>
		expect(zip([1, 2], ["a", "b", "c"])).toEqual([[1, "a"], [2, "b"]]));
	it("empty", () => expect(zip([], [])).toEqual([]));
});

describe("unzip", () => {
	it("unzips pairs", () =>
		expect(unzip([[1, "a"], [2, "b"], [3, "c"]])).toEqual([[1, 2, 3], ["a", "b", "c"]]));
	it("empty", () => expect(unzip([])).toEqual([[], []]));
});

describe("difference", () => {
	it("returns elements not in b", () =>
		expect(difference([1, 2, 3, 4], [2, 4])).toEqual([1, 3]));
	it("empty b returns a", () =>
		expect(difference([1, 2], [])).toEqual([1, 2]));
	it("all removed", () =>
		expect(difference([1, 2], [1, 2, 3])).toEqual([]));
});

describe("intersection", () => {
	it("returns common elements", () =>
		expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]));
	it("no overlap", () =>
		expect(intersection([1, 2], [3, 4])).toEqual([]));
	it("empty", () => expect(intersection([], [1, 2])).toEqual([]));
});

describe("union", () => {
	it("merges and deduplicates", () =>
		expect(union([1, 2, 3], [2, 3, 4])).toEqual([1, 2, 3, 4]));
	it("preserves order", () =>
		expect(union([3, 1], [2, 1])).toEqual([3, 1, 2]));
	it("empty", () => expect(union([], [1, 2])).toEqual([1, 2]));
});
