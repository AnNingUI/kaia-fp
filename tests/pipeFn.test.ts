import { describe, it, expect } from "vitest";
import { pipe, pipeAsync } from "../src/utils/pipe/pipe";
import { tap, clamp, between } from "../src/utils/combinators";

describe("pipe .extends()", () => {
	it("基本可调用 — pipe 结果仍然是函数", () => {
		const add1 = (n: number) => n + 1;
		const double = (n: number) => n * 2;
		const result = pipe(add1, double);
		expect(result(3)).toBe(8); // (3+1)*2
	});

	it("extends 单步", () => {
		const add1 = (n: number) => n + 1;
		const double = (n: number) => n * 2;
		const negate = (n: number) => -n;

		const base = pipe(add1, double);
		const extended = base.extends(negate);

		expect(extended(3)).toBe(-8); // (3+1)*2 = 8, -8
	});

	it("extends 多步", () => {
		const add1 = (n: number) => n + 1;
		const double = (n: number) => n * 2;
		const negate = (n: number) => -n;
		const toString = (n: number) => `result: ${n}`;

		const base = pipe(add1);
		const extended = base.extends(double, negate, toString);

		expect(extended(3)).toBe("result: -8");
	});

	it("链式 extends", () => {
		const add1 = (n: number) => n + 1;
		const double = (n: number) => n * 2;
		const negate = (n: number) => -n;

		const result = pipe(add1).extends(double).extends(negate);

		expect(result(3)).toBe(-8);
	});

	it("extends 结果与 pipe 等价", () => {
		const add1 = (n: number) => n + 1;
		const double = (n: number) => n * 2;
		const negate = (n: number) => -n;

		const viaPipe = pipe(add1, double, negate);
		const viaExtends = pipe(add1, double).extends(negate);

		expect(viaExtends(3)).toBe(viaPipe(3));
		expect(viaExtends(0)).toBe(viaPipe(0));
		expect(viaExtends(-5)).toBe(viaPipe(-5));
	});

	it("point-free extends — clamp + between", () => {
		const normalize = pipe(
			clamp(0, 100),
		).extends(
			between(0, 50),
		);

		expect(normalize(150)).toBe(false);  // clamp→100, between(0,50)→false
		expect(normalize(30)).toBe(true);     // clamp→30, between(0,50)→true
		expect(normalize(-5)).toBe(true);     // clamp→0, between(0,50)→true
	});

	it("extends + tap 日志", () => {
		const log: string[] = [];

		const base = pipe(
			(n: number) => n * 2,
		);

		const extended = base.extends(
			tap((n: number) => log.push(`doubled: ${n}`)),
			(n: number) => n + 1,
			tap((n: number) => log.push(`final: ${n}`)),
		);

		const result = extended(5);

		expect(result).toBe(11); // 5*2=10, tap, 10+1=11, tap
		expect(log).toEqual(["doubled: 10", "final: 11"]);
	});

	it("多次链式 extends 的结果正确性", () => {
		const result = pipe(
			(s: string) => s.trim(),
		)
			.extends((s: string) => s.toLowerCase())
			.extends((s: string) => s.split(""))
			.extends((arr: string[]) => arr.filter((c) => c !== " "))
			.extends((arr: string[]) => arr.join("-"));

		expect(result("  Hello World  ")).toBe("h-e-l-l-o-w-o-r-l-d");
	});
});

describe("pipeAsync .extends()", () => {
	it("基本可调用 — 同步函数混合", async () => {
		const result = pipeAsync(
			async (n: number) => n + 1,
			(n: number) => n * 2,
		);
		expect(await result(3)).toBe(8);
	});

	it("基本可调用 — 全异步", async () => {
		const result = pipeAsync(
			async (n: number) => n + 1,
			async (n: number) => n * 2,
		);
		expect(await result(3)).toBe(8);
	});

	it("extends 单步", async () => {
		const base = pipeAsync(
			async (n: number) => n + 1,
			(n: number) => n * 2,
		);
		const extended = base.extends(
			async (n: number) => -n,
		);
		expect(await extended(3)).toBe(-8);
	});

	it("extends 多步", async () => {
		const base = pipeAsync(
			async (n: number) => n + 1,
		);
		const extended = base.extends(
			(n: number) => n * 2,
			async (n: number) => -n,
			(n: number) => `result: ${n}`,
		);
		expect(await extended(3)).toBe("result: -8");
	});

	it("链式 extends", async () => {
		const result = pipeAsync(
			async (n: number) => n + 1,
		)
			.extends((n: number) => n * 2)
			.extends(async (n: number) => -n);

		expect(await result(3)).toBe(-8);
	});

	it("extends 结果与 pipeAsync 等价", async () => {
		const add1 = async (n: number) => n + 1;
		const double = (n: number) => n * 2;
		const negate = async (n: number) => -n;

		const viaPipe = pipeAsync(add1, double, negate);
		const viaExtends = pipeAsync(add1, double).extends(negate);

		expect(await viaExtends(3)).toBe(await viaPipe(3));
		expect(await viaExtends(-5)).toBe(await viaPipe(-5));
	});

	it("中间类型推导 — 不同类型传递", async () => {
		const result = pipeAsync(
			async (s: string) => s.trim(),
			(s: string) => s.length,
			async (n: number) => n * 2,
		);
		expect(await result("  hello  ")).toBe(10); // "hello".length=5, 5*2=10
	});

	it("中间类型 + extends", async () => {
		const result = pipeAsync(
			async (s: string) => s.trim(),
		)
			.extends((s: string) => s.split(" "))
			.extends(async (arr: string[]) => arr.length);

		expect(await result("  hello beautiful world  ")).toBe(3);
	});
});
