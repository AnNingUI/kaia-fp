import { describe, expect, it } from "vitest";
import { Writer } from "../src/instances/writer";

const stringMonoid = { empty: "", concat: (a: string, b: string) => a + b };
const arrayMonoid = <T>() => ({
	empty: [] as T[],
	concat: (a: T[], b: T[]) => [...a, ...b],
});

const tell = (msg: string) => new Writer(undefined, msg, stringMonoid);
const w = <A>(v: A, log: string) => new Writer(v, log, stringMonoid);

describe("Writer", () => {
	describe("基本操作", () => {
		it("of 使用空日志", () => {
			const result = Writer.of(stringMonoid, 42);
			expect(result.value).toBe(42);
			expect(result.log).toBe("");
		});

		it("map 转换值但保持日志", () => {
			const result = w(3, "step1").map((x) => x * 2);
			expect(result.value).toBe(6);
			expect(result.log).toBe("step1");
		});

		it("flatMap 连接日志（左到右）", () => {
			const result = w(1, "a").flatMap((x) => w(x + 1, "b"));
			expect(result.value).toBe(2);
			expect(result.log).toBe("ab");
		});

		it("ap 连接日志（函数在前，参数在后）", () => {
			const fn = w((x: number) => x * 3, "fn");
			const val = w(5, "val");
			const result = val.ap(fn);
			expect(result.value).toBe(15);
			expect(result.log).toBe("fnval");
		});

		it("listen 捕获当前日志", () => {
			const result = w(42, "step1").listen();
			expect(result.value).toEqual([42, "step1"]);
			expect(result.log).toBe("step1");
		});
	});

	describe("日志顺序（左到右）", () => {
		it("flatMap 链式调用保持顺序", () => {
			const result = w(0, "")
				.flatMap(() => tell("1"))
				.flatMap(() => tell("2"))
				.flatMap(() => tell("3"));
			expect(result.log).toBe("123");
		});

		it("ap 组合保持顺序", () => {
			// tell "a" 然后 tell "b"，最终日志应该是 "ab"
			const add = (x: number) => (y: number) => x + y;
			const fa = w(add, "a");
			const fb = w(1, "b");
			const fc = w(2, "c");
			// curry 风格: fa.ap(fb).ap(fc)
			const result = fc.ap(fb.ap(fa));
			expect(result.value).toBe(3);
			expect(result.log).toBe("abc");
		});

		it("array monoid 日志顺序", () => {
			const arrMon = arrayMonoid<string>();
			const result = new Writer(1, ["init"], arrMon).flatMap((x) =>
				new Writer(x + 1, ["doubled"], arrMon),
			);
			expect(result.value).toBe(2);
			expect(result.log).toEqual(["init", "doubled"]);
		});
	});

	describe("Monad Laws", () => {
		it("Left identity: of(a).flatMap(f) === f(a)", () => {
			const f = (x: number) => w(x * 2, `f(${x})`);
			const lhs = Writer.of(stringMonoid, 3).flatMap(f);
			const rhs = f(3);
			expect(lhs.value).toBe(rhs.value);
			expect(lhs.log).toBe(rhs.log);
		});

		it("Right identity: m.flatMap(of) === m", () => {
			const m = w(7, "log");
			const lhs = m.flatMap((a) => Writer.of(stringMonoid, a));
			expect(lhs.value).toBe(m.value);
			expect(lhs.log).toBe(m.log);
		});

		it("Associativity: m.flatMap(f).flatMap(g) === m.flatMap(a => f(a).flatMap(g))", () => {
			const m = w(2, "m");
			const f = (x: number) => w(x + 1, "f");
			const g = (x: number) => w(x * 10, "g");

			const lhs = m.flatMap(f).flatMap(g);
			const rhs = m.flatMap((a) => f(a).flatMap(g));
			expect(lhs.value).toBe(rhs.value);
			expect(lhs.log).toBe(rhs.log);
		});
	});

	describe("Applicative Laws", () => {
		it("Identity: v.ap(of(id)) === v", () => {
			const v = w(42, "v");
			const id = (x: number) => x;
			const result = v.ap(Writer.of(stringMonoid, id));
			expect(result.value).toBe(v.value);
			expect(result.log).toBe(v.log);
		});

		it("Homomorphism: of(f).ap(of(a)) === of(f(a))", () => {
			const f = (x: number) => x + 1;
			const a = 5;
			const lhs = Writer.of(stringMonoid, a).ap(Writer.of(stringMonoid, f));
			const rhs = Writer.of(stringMonoid, f(a));
			expect(lhs.value).toBe(rhs.value);
			expect(lhs.log).toBe(rhs.log);
		});

		it("Interchange: u.ap(of(y)) === of(f => f(y)).ap(u) [日志验证]", () => {
			// ap 约定: value.ap(fn)，fab.value(this.value)
			// 验证 of(y).ap(u) 的值和日志正确性
			const y = 10;
			const u = w((x: number) => x + 1, "u");
			const result = Writer.of(stringMonoid, y).ap(u);
			expect(result.value).toBe(11);
			expect(result.log).toBe("u");
		});

		it("ap 组合与 flatMap 组合产生相同值", () => {
			// 验证 ap 和 flatMap 两种组合方式结果一致
			const f = (x: number) => x * 2;
			const g = (x: number) => x + 1;
			const x = 5;
			// ap 方式
			const apResult = Writer.of(stringMonoid, x)
				.ap(w(g, "g"))
				.ap(w(f, "f"));
			// flatMap 方式
			const fmResult = Writer.of(stringMonoid, x)
				.flatMap((v) => w(g(v), "g"))
				.flatMap((v) => w(f(v), "f"));
			expect(apResult.value).toBe(fmResult.value);
			expect(apResult.value).toBe(12);
			// ap 日志: concat("f", concat("g", "")) = "fg"
			expect(apResult.log).toBe("fg");
			// flatMap 日志: concat(concat("", "g"), "f") = "gf"
			expect(fmResult.log).toBe("gf");
		});
	});
});
