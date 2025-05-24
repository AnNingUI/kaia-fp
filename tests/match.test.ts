// tests/realScenario.test.ts
import { describe, expect, it } from "vitest";
import {
	defineShape,
	getShape,
	is,
	match,
	matchSync,
	matchSyncMemo,
} from "../src/utils";
const numListBuilder = (n: number) => {
	let _list = [];
	for (let i = 0; i < n; i++) {
		_list.push(i * 10 * Math.random());
	}
	return _list;
};
function measureSync<I, O>(fn: (i: I) => O, arg: I) {
	const start = performance.now();
	const res = fn(arg);
	const end = performance.now();
	return { duration: end - start, result: res };
}
const numList = numListBuilder(100_0000);

describe("模拟实际场景测试", () => {
	describe("Match Functionality", () => {
		// 数字匹配和条件
		it("should match numbers with conditions", async () => {
			const result = await match<unknown, string>()
				.with(is.number().gt(5).lt(50).match, (n) => `数字：5 < ${n} < 50`)
				.otherwise(() => "未知数字")
				.run(42);

			expect(result).toBe("数字：5 < 42 < 50");
		});

		// 字符串匹配和正则表达式
		it("should match strings with regex conditions", async () => {
			const result = await match<any, string>()
				.with(
					is.string().test(/^hello/).match,
					(str) => `以 hello 开头: ${str}`
				)
				.with(
					is.string().test(/world$/).match,
					(str) => `以 world 结尾: ${str}`
				)
				.otherwise(() => "未知字符串")
				.run("hello world");

			expect(result).toBe("以 hello 开头: hello world");
		});

		// 对象匹配，使用 `shape` 和 `optional` 和 `union`
		it("should match objects using shape", async () => {
			const personShape = is.shape({
				name: is.string().match,
				age: is.optional(is.number().inRange(0, 500).match),
				permissions: is.union(is.literal(1).match, is.literal(2).match),
			});
			defineShape("Person", personShape);
			const result = await match<unknown, string>()
				.with(
					getShape<typeof personShape.inter>("Person")!,
					(person) => `Hi ${person.name} (${person.age ?? "?"})`
				)
				.otherwise(() => "默认")
				.run({ name: "Tom", age: 33, permissions: 1 });

			expect(result).toBe("Hi Tom (33)");
		});

		// 对象继承匹配
		it("should match objects using inheritance", async () => {
			const personShape = is.shape({
				name: is.string().match,
				age: is.optional(is.number().inRange(0, 500).match),
			});
			const pPersonShape = is
				.shape({
					permissions: is.union(is.literal(1).match, is.literal(2).match),
				})
				.extends(personShape);
			type pPersonShapeType = typeof pPersonShape.inter;
			defineShape("pPerson", pPersonShape);
			const result = await match<unknown, string>()
				.with(
					getShape<pPersonShapeType>("pPerson")!,
					(person) =>
						`[P-${person.permissions}] Hi ${person.name} (${person.age ?? "?"})`
				)
				.otherwise(() => "默认")
				.run({ name: "Tom", age: 33, permissions: 1 });

			expect(result).toBe("[P-1] Hi Tom (33)");
		});
		// 元组匹配
		it("should match tuples", async () => {
			const result = await match<unknown, string>()
				.with(
					is.tuple([is.string().match, is.number().match]),
					([name, age]) => `元组匹配：${name}-${age}`
				)
				.otherwise(() => "未知元组")
				.run(["Tom", 30]);

			expect(result).toBe("元组匹配：Tom-30");
		});

		// 异常场景，`otherwise` 默认返回
		it("should fallback when no match is found", async () => {
			const result = await match<unknown, string>()
				.with(is.number().gt(100).match, (n) => `大于100：${n}`)
				.with(is.string().test(/^abc/).match, (str) => `以 abc 开头：${str}`)
				.otherwise(() => "默认情况")
				.run(true);

			expect(result).toBe("默认情况");
		});
	});

	describe("Complex Async Scenario", () => {
		it("should handle asynchronous matching correctly", async () => {
			const result = await match<unknown, string>()
				.with(is.number().gt(100).match, async (n) => `大于100：${n}`)
				.with(is.number().lt(50).match, async (n) => `小于50：${n}`)
				.otherwise(() => "默认数字")
				.run(150);

			expect(result).toBe("大于100：150");
		});
	});

	const fib = (n: number): number => {
		if (n <= 1 || n == 2) return 1;
		return fib(n - 1) + fib(n - 2);
	};

	// 内存换时间的函数 fibM 与 fibSyncMemo
	function fibM(n: number): bigint {
		if (n === 0) return 0n;
		type bigtuple = [bigint, bigint, bigint, bigint];
		const mul = ([a, b, c, d]: bigtuple, [e, f, g, h]: bigtuple) =>
			[a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h] as bigtuple;
		const pow = (m: bigtuple, n: number): bigtuple =>
			n === 0
				? [1n, 0n, 0n, 1n]
				: n % 2 === 0
				? pow(mul(m, m), n / 2)
				: mul(m, pow(m, n - 1));
		return pow([1n, 1n, 1n, 0n], n - 1)[0];
	}

	const fibSyncMemo = matchSyncMemo<bigint, bigint>(
		(self, m) =>
			m
				.with2((n) => n <= 1n || n === 2n, 1n)
				.otherwise((n) => self(n - 1n) + self(n - 2n)),
		{
			useLRU: true,
			maxSize: 20,
			maxAge: 3200,
		}
	);

	function fibFastMemo(n: bigint): bigint {
		if (n === 0n) return 0n;
		if (n === 1n) return 1n;

		type bigtuple = [bigint, bigint, bigint, bigint];

		const mul = ([a, b, c, d]: bigtuple, [e, f, g, h]: bigtuple): bigtuple => [
			a * e + b * g,
			a * f + b * h,
			c * e + d * g,
			c * f + d * h,
		];

		const memoPow = matchSyncMemo<bigint, bigtuple>(
			(self, m) =>
				m
					.with2(0n, () => [1n, 0n, 0n, 1n]) // identity matrix
					.otherwise((n) =>
						n % 2n === 0n
							? mul(self(n / 2n), self(n / 2n))
							: mul(base, self(n - 1n))
					),
			{
				useLRU: true,
				maxSize: 128, // 可根据性能与内存做权衡调整
				maxAge: 10000,
			}
		);

		const base: bigtuple = [1n, 1n, 1n, 0n];
		return memoPow(n - 1n)[0];
	}

	describe("base math functions", () => {
		it("fib", () => {
			const a = 1100;
			const ba = BigInt(a);
			const afs = measureSync(fibSyncMemo, ba);
			console.log("[fibSyncMemo]: " + afs.duration + "ms");
			const afm = measureSync(fibM, a);
			console.log("[fibM]: " + afm.duration + "ms");
			const afm2 = measureSync(fibFastMemo, ba);
			console.log("[fibFastMemo]: " + afm2.duration + "ms");
			console.log("fibSyncMemo 与 fibM误差：", afs.result - afm.result);
			console.log("fibSyncMemo 与 fibFastMemo误差：", afm.result - afm2.result);

			expect(afm.result).toBe(afm2.result);
		});
	});

	describe("Performance Test", () => {
		// 130ms
		it("100_0000随机大数据匹配判断性能测试", () => {
			const manager = matchSync<number, string>();
			// Define the matchers
			manager
				.with(is.number().gt(1000).match, (val) => `大于1000：${val}`)
				.with(is.number().lt(10).match, (val) => `小于10：${val}`)
				.otherwise(() => "默认数字");

			// Use matchForEach to handle each item lazily
			const results: string[] = [];
			manager.forEach(numList, (u) => {
				results.push(u);
			});
			const iss: boolean[] = [];
			// Validate the results
			results.forEach((result, i) => {
				const u = numList[i];
				if (
					result ==
					(u > 1000 ? `大于1000：${u}` : u < 10 ? `小于10：${u}` : "默认数字")
				) {
					iss.push(true);
				}
			});
			console.log("匹配结果正确率：" + iss.length / numList.length);
			expect(iss.length).toBe(numList.length);
		});
	});
});
