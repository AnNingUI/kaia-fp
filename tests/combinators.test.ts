import { describe, it, expect, vi } from "vitest";
import {
	identity,
	constant,
	complement,
	flow,
	memoize,
} from "../src/utils/combinators";
import { MiniLRUCache } from "../src/utils/cache/miniLRUCache";

describe("identity", () => {
	it("returns the value unchanged", () => {
		expect(identity(42)).toBe(42);
		expect(identity("hello")).toBe("hello");
		expect(identity(null)).toBe(null);
		expect(identity(undefined)).toBe(undefined);
	});

	it("preserves reference for objects", () => {
		const obj = { a: 1 };
		expect(identity(obj)).toBe(obj);
	});

	it("works in pipe/flow context", () => {
		const result = flow(
			identity<number>,
			(x) => x * 2,
		)(5);
		expect(result).toBe(10);
	});
});

describe("constant", () => {
	it("returns a function that always returns the given value", () => {
		const always42 = constant(42);
		expect(always42()).toBe(42);
		expect(always42()).toBe(42);
	});

	it("works with falsy values", () => {
		expect(constant(0)()).toBe(0);
		expect(constant("")()).toBe("");
		expect(constant(null)()).toBe(null);
		expect(constant(false)()).toBe(false);
	});

	it("preserves reference", () => {
		const obj = { a: 1 };
		const fn = constant(obj);
		expect(fn()).toBe(obj);
		expect(fn()).toBe(obj);
	});
});

describe("complement", () => {
	it("negates a predicate", () => {
		const isPositive = (n: number) => n > 0;
		const isNonPositive = complement(isPositive);

		expect(isNonPositive(1)).toBe(false);
		expect(isNonPositive(0)).toBe(true);
		expect(isNonPositive(-1)).toBe(true);
	});

	it("works with type guards", () => {
		const isString = (v: unknown): v is string => typeof v === "string";
		const isNotString = complement(isString);

		expect(isNotString("hello")).toBe(false);
		expect(isNotString(42)).toBe(true);
		expect(isNotString(null)).toBe(true);
	});

	it("handles multi-arg predicates", () => {
		const inRange = (min: number, max: number, val: number) =>
			val >= min && val <= max;
		const outOfRange = complement(inRange);

		expect(outOfRange(1, 10, 5)).toBe(false);
		expect(outOfRange(1, 10, 15)).toBe(true);
	});
});

describe("flow", () => {
	it("composes single function", () => {
		const double = (n: number) => n * 2;
		expect(flow(double)(5)).toBe(10);
	});

	it("composes two functions left to right", () => {
		const double = (n: number) => n * 2;
		const addOne = (n: number) => n + 1;
		expect(flow(double, addOne)(3)).toBe(7); // 3*2+1
	});

	it("composes three functions", () => {
		const toString = (n: number) => n.toString();
		const double = (n: number) => n * 2;
		const wrap = (s: string) => `[${s}]`;

		const pipeline = flow(double, toString, wrap);
		expect(pipeline(5)).toBe("[10]");
	});

	it("supports type-changing composition", () => {
		const parse = (s: string) => parseInt(s, 10);
		const double = (n: number) => n * 2;
		const toHex = (n: number) => n.toString(16);

		const pipeline = flow(parse, double, toHex);
		expect(pipeline("10")).toBe("14"); // 10 -> 20 -> "14"
	});

	it("composes many functions", () => {
		const pipeline = flow(
			(x: number) => x + 1,
			(x: number) => x * 2,
			(x: number) => x - 3,
			(x: number) => x.toString(),
			(x: string) => `result: ${x}`,
		);
		expect(pipeline(5)).toBe("result: 9"); // (5+1)*2-3 = 9
	});
});

describe("memoize", () => {
	it("caches primitive arguments", () => {
		const fn = vi.fn((n: number) => n * n);
		const memoized = memoize(fn);

		expect(memoized(5)).toBe(25);
		expect(memoized(5)).toBe(25);
		expect(memoized(3)).toBe(9);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("caches object arguments via WeakMap", () => {
		const fn = vi.fn((obj: { x: number }) => obj.x * 2);
		const memoized = memoize(fn);

		const a = { x: 5 };
		expect(memoized(a)).toBe(10);
		expect(memoized(a)).toBe(10);
		expect(fn).toHaveBeenCalledTimes(1);

		const b = { x: 5 };
		expect(memoized(b)).toBe(10); // different reference, different cache entry
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("works with multi-arg functions via JSON.stringify keyFn", () => {
		const fn = vi.fn((a: number, b: number) => a + b);
		const memoized = memoize(fn);

		expect(memoized(1, 2)).toBe(3);
		expect(memoized(1, 2)).toBe(3);
		expect(memoized(2, 3)).toBe(5);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("supports custom keyFn", () => {
		const fn = vi.fn((obj: { id: number; name: string }) => obj.name.toUpperCase());
		const memoized = memoize(fn, {
			keyFn: (obj) => obj.id, // only cache by id
		});

		const a = { id: 1, name: "alice" };
		expect(memoized(a)).toBe("ALICE");

		const b = { id: 1, name: "bob" };
		expect(memoized(b)).toBe("ALICE"); // same id, cached result

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("supports custom cache implementation", () => {
		const fn = vi.fn((n: number) => n * 10);
		const cache = new MiniLRUCache<unknown, number>(3);
		const memoized = memoize(fn, { cache });

		memoized(1); // call 1
		memoized(2); // call 2
		memoized(3); // call 3
		expect(fn).toHaveBeenCalledTimes(3);

		memoized(1); // cache hit, promotes key 1 to head
		expect(fn).toHaveBeenCalledTimes(3);

		memoized(4); // evicts key 2 (LRU tail), call 4
		expect(fn).toHaveBeenCalledTimes(4);
		expect(cache.has(2)).toBe(false);

		memoized(2); // evicted, recompute, call 5
		expect(fn).toHaveBeenCalledTimes(5);
	});

	it("handles single-arg shorthand (no JSON.stringify)", () => {
		const fn = vi.fn((s: string) => s.length);
		const memoized = memoize(fn);

		expect(memoized("hello")).toBe(5);
		expect(memoized("hello")).toBe(5);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("caches null and undefined results", () => {
		let callCount = 0;
		const fn = (_: number) => {
			callCount++;
			return callCount === 1 ? null : 42;
		};
		const memoized = memoize(fn);

		expect(memoized(1)).toBe(null);
		expect(memoized(1)).toBe(null); // cached null
		expect(callCount).toBe(1);
	});
});
