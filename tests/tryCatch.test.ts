import { describe, expect, it } from "vitest";
import { Result, isFailure, isSuccess, tryCatch } from "../src/utils/pipe";

describe("tryCatch", () => {
	it("wraps a successful sync function", () => {
		const fn = tryCatch((x: number) => x * 2);
		const result = fn(2);
		expect(isSuccess(result)).toBe(true);
		expect(Result.unwrap(result)).toBe(4);
	});

	it("wraps a failing sync function", () => {
		const fn = tryCatch(() => {
			throw new Error("fail");
		});
		const result = fn();
		expect(isFailure(result)).toBe(true);
		expect(() => Result.unwrap(result)).toThrow("fail");
	});

	it("wraps a successful async function", async () => {
		const yt = async (x: number) => x + 1;
		const fn = tryCatch(async (x: number) => x + 1);
		const result = await fn(1);
		expect(isSuccess(result)).toBe(true);
		expect(Result.unwrap(result)).toBe(2);
	});

	it("wraps a failing async function", async () => {
		const fn = tryCatch(async () => {
			throw new Error("async fail");
		});
		const result = await fn(); // ✅ await added
		expect(isFailure(result)).toBe(true); // ✅ result is no longer a Promise
		expect(() => Result.unwrap(result)).toThrow(); // ✅ now passes
	});

	it("calls onError handler when provided", () => {
		const fn = tryCatch(
			() => {
				throw new Error("err");
			},
			{
				onError: (err) => `handled: ${err.message}`,
			}
		);
		const result = fn();
		expect(result).toEqual({
			success: false,
			error: "handled: err",
		});
	});

	it("rethrows error if rethrow is true", () => {
		const fn = tryCatch(
			() => {
				throw new Error("boom");
			},
			{
				onError: (err) => `handled ${err.message}`,
				rethrow: true,
			}
		);
		expect(() => fn()).toThrow("handled boom");
	});
});

describe("Result helpers", () => {
	it("unwrap returns value on success", () => {
		const result = { success: true, value: 123 } as const;
		expect(Result.unwrap(result)).toBe(123);
	});

	it("unwrap throws on failure", () => {
		const result = { success: false, error: "err" } as const;
		expect(() => Result.unwrap(result)).toThrow("err");
	});

	it("map transforms success", () => {
		const result = Result.map({ success: true, value: 2 }, (v) => v + 1);
		expect(result).toEqual({ success: true, value: 3 });
	});

	it("mapError transforms error", () => {
		const result = Result.mapError(
			{ success: false, error: "oops" },
			(e) => `!${e}`
		);
		expect(result).toEqual({ success: false, error: "!oops" });
	});

	it("combine aggregates multiple success", () => {
		const combined = Result.combine({
			a: { success: true, value: 1 },
			b: { success: true, value: 2 },
		});
		expect(combined).toEqual({ success: true, value: { a: 1, b: 2 } });
	});

	it("combine stops on first failure", () => {
		const combined = Result.combine({
			a: { success: true, value: 1 },
			b: { success: false, error: "fail" },
		});
		expect(combined).toEqual({ success: false, error: "fail" });
	});
});
