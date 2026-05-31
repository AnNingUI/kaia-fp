import { describe, it, expect, vi } from "vitest";
import {
	tap,
	once,
	clamp,
	between,
	prop,
	pick,
	omit,
} from "../src/utils/combinators";

describe("tap", () => {
	it("runs side effect and returns original value", () => {
		const log: number[] = [];
		const result = tap((x: number) => log.push(x))(5);
		expect(result).toBe(5);
		expect(log).toEqual([5]);
	});

	it("works in a pipeline", () => {
		const log: string[] = [];
		const process = (x: number) =>
			[x]
				.map(tap((n) => log.push(`got ${n}`)))
				.map((n) => n * 2)
				.map(tap((n) => log.push(`doubled to ${n}`)))[0];

		expect(process(3)).toBe(6);
		expect(log).toEqual(["got 3", "doubled to 6"]);
	});

	it("preserves object reference", () => {
		const obj = { a: 1 };
		const result = tap(() => {})(obj);
		expect(result).toBe(obj);
	});
});

describe("once", () => {
	it("calls function only once", () => {
		const fn = vi.fn(() => 42);
		const onceFn = once(fn);
		expect(onceFn()).toBe(42);
		expect(onceFn()).toBe(42);
		expect(onceFn()).toBe(42);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("ignores subsequent arguments", () => {
		const fn = vi.fn((a: number, b: number) => a + b);
		const onceFn = once(fn);
		expect(onceFn(1, 2)).toBe(3);
		expect(onceFn(10, 20)).toBe(3); // still returns 3
		expect(fn).toHaveBeenCalledTimes(1);
	});
});

describe("clamp", () => {
	it("returns value within range", () => {
		expect(clamp(0, 10, 5)).toBe(5);
	});

	it("clamps to min", () => {
		expect(clamp(0, 10, -5)).toBe(0);
	});

	it("clamps to max", () => {
		expect(clamp(0, 10, 15)).toBe(10);
	});

	it("works at boundaries", () => {
		expect(clamp(0, 10, 0)).toBe(0);
		expect(clamp(0, 10, 10)).toBe(10);
	});
});

describe("between", () => {
	it("true within range", () => {
		expect(between(0, 10, 5)).toBe(true);
	});

	it("true at boundaries", () => {
		expect(between(0, 10, 0)).toBe(true);
		expect(between(0, 10, 10)).toBe(true);
	});

	it("false outside range", () => {
		expect(between(0, 10, -1)).toBe(false);
		expect(between(0, 10, 11)).toBe(false);
	});
});

describe("prop", () => {
	it("extracts a property", () => {
		const getName = prop("name");
		expect(getName({ name: "alice", age: 30 })).toBe("alice");
	});

	it("works with different keys", () => {
		expect(prop("x")({ x: 10, y: 20 })).toBe(10);
		expect(prop("y")({ x: 10, y: 20 })).toBe(20);
	});
});

describe("pick", () => {
	it("picks specified keys", () => {
		const result = pick({ a: 1, b: 2, c: 3 }, "a", "b");
		expect(result).toEqual({ a: 1, b: 2 });
	});

	it("ignores missing keys", () => {
		const result = pick({ a: 1, b: 2 }, "a");
		expect(result).toEqual({ a: 1 });
	});

	it("picks single key", () => {
		const result = pick({ name: "alice", age: 30 }, "name");
		expect(result).toEqual({ name: "alice" });
	});
});

describe("omit", () => {
	it("omits specified keys", () => {
		const result = omit({ a: 1, b: 2, c: 3 }, "c");
		expect(result).toEqual({ a: 1, b: 2 });
	});

	it("omits multiple keys", () => {
		const result = omit({ a: 1, b: 2, c: 3 }, "a", "b");
		expect(result).toEqual({ c: 3 });
	});

	it("omitting non-existent key is safe", () => {
		const result = omit({ a: 1 }, "a");
		expect(result).toEqual({});
	});
});
