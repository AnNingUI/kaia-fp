import { describe, it, expect } from "vitest";
import {
	traverseOption,
	sequenceOption,
	traverseEither,
	sequenceEither,
	groupBy,
	partition,
} from "../src/utils/collection";
import { Some, None, Options } from "../src/instances/option";
import { Left, Right } from "../src/utils/either";

describe("traverseOption", () => {
	it("all Some returns Some of array", () => {
		const result = traverseOption([1, 2, 3], (x) => new Some(x * 2));
		expect(result.isSome()).toBe(true);
		expect(result.get()).toEqual([2, 4, 6]);
	});

	it("any None returns None", () => {
		const result = traverseOption([1, 2, 3], (x) =>
			x === 2 ? (None.of() as Options<number>) : new Some(x)
		);
		expect(result.isNone()).toBe(true);
	});

	it("empty array returns Some([])", () => {
		const result = traverseOption([], (x: number) => new Some(x));
		expect(result.isSome()).toBe(true);
		expect(result.get()).toEqual([]);
	});

	it("provides index to callback", () => {
		const indices: number[] = [];
		traverseOption(["a", "b", "c"], (_val, i) => {
			indices.push(i);
			return new Some(i);
		});
		expect(indices).toEqual([0, 1, 2]);
	});

	it("parses strings to numbers", () => {
		const parseNum = (s: string): Options<number> => {
			const n = Number(s);
			return isNaN(n) ? (None.of() as Options<number>) : new Some(n);
		};
		expect(traverseOption(["1", "2", "3"], parseNum).get()).toEqual([1, 2, 3]);
		expect(traverseOption(["1", "abc", "3"], parseNum).isNone()).toBe(true);
	});
});

describe("sequenceOption", () => {
	it("all Some returns Some of array", () => {
		const result = sequenceOption([new Some(1), new Some(2), new Some(3)]);
		expect(result.get()).toEqual([1, 2, 3]);
	});

	it("any None returns None", () => {
		const result = sequenceOption([new Some(1), None.of() as Options<number>, new Some(3)]);
		expect(result.isNone()).toBe(true);
	});

	it("empty array returns Some([])", () => {
		const result = sequenceOption([]);
		expect(result.isSome()).toBe(true);
		expect(result.get()).toEqual([]);
	});
});

describe("traverseEither", () => {
	it("all Right returns Right of array", () => {
		const result = traverseEither([1, 2, 3], (x) => new Right(x * 2));
		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual([2, 4, 6]);
	});

	it("any Left returns first Left", () => {
		const result = traverseEither([1, 2, 3], (x) =>
			x === 2 ? new Left("error") : new Right(x)
		);
		expect(result.isLeft()).toBe(true);
		expect(result.value).toBe("error");
	});

	it("empty array returns Right([])", () => {
		const result = traverseEither([], (x: number) => new Right(x));
		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual([]);
	});

	it("provides index to callback", () => {
		const indices: number[] = [];
		traverseEither(["a", "b", "c"], (_val, i) => {
			indices.push(i);
			return new Right(i);
		});
		expect(indices).toEqual([0, 1, 2]);
	});
});

describe("sequenceEither", () => {
	it("all Right returns Right of array", () => {
		const result = sequenceEither([new Right(1), new Right(2), new Right(3)]);
		expect(result.value).toEqual([1, 2, 3]);
	});

	it("any Left returns first Left", () => {
		const result = sequenceEither([new Right(1), new Left("err"), new Right(3)]);
		expect(result.isLeft()).toBe(true);
		expect(result.value).toBe("err");
	});

	it("empty array returns Right([])", () => {
		const result = sequenceEither([]);
		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual([]);
	});
});

describe("groupBy", () => {
	it("groups by key", () => {
		const items = [
			{ type: "a", value: 1 },
			{ type: "b", value: 2 },
			{ type: "a", value: 3 },
		];
		const result = groupBy(items, (x) => x.type);
		expect(result["a"]).toHaveLength(2);
		expect(result["b"]).toHaveLength(1);
		expect(result["a"][0].value).toBe(1);
		expect(result["a"][1].value).toBe(3);
	});

	it("groups numbers by parity", () => {
		const result = groupBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? "even" : "odd"));
		expect(result["even"]).toEqual([2, 4]);
		expect(result["odd"]).toEqual([1, 3, 5]);
	});

	it("empty array returns empty object", () => {
		const result = groupBy([], (x: never) => x);
		expect(result).toEqual({});
	});
});

describe("partition", () => {
	it("splits by predicate", () => {
		const [evens, odds] = partition([1, 2, 3, 4, 5], (n) => n % 2 === 0);
		expect(evens).toEqual([2, 4]);
		expect(odds).toEqual([1, 3, 5]);
	});

	it("all truthy", () => {
		const [truthy, falsy] = partition([1, 2, 3], () => true);
		expect(truthy).toEqual([1, 2, 3]);
		expect(falsy).toEqual([]);
	});

	it("all falsy", () => {
		const [truthy, falsy] = partition([1, 2, 3], () => false);
		expect(truthy).toEqual([]);
		expect(falsy).toEqual([1, 2, 3]);
	});

	it("empty array", () => {
		const [truthy, falsy] = partition([], () => true);
		expect(truthy).toEqual([]);
		expect(falsy).toEqual([]);
	});
});
