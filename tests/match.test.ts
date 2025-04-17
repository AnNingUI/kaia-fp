// tests/realScenario.test.ts
import { describe, expect, it } from "vitest";
import {
	defineShape,
	getShape,
	is,
	match,
	matchSync,
} from "../src/utils/match";

const numListBuilder = (n: number) => {
	let _list = [];
	for (let i = 0; i < n; i++) {
		_list.push(i * 10 * Math.random());
	}
	return _list;
};

const numList = numListBuilder(10000);

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

		// 对象匹配，使用 `shape` 和 `optional`
		it("should match objects using shape", async () => {
			const personShape = is.shape({
				name: is.string().match,
				age: is.optional(is.number().gt(0).match),
			});
			defineShape("Person", personShape);
			const result = await match<unknown, string>()
				.with(
					getShape<{ name: string; age?: number }>("Person")!,
					(person) => `Hi ${person.name} (${person.age ?? "?"})`
				)
				.otherwise(() => "默认")
				.run({ name: "Tom", age: 33 });

			expect(result).toBe("Hi Tom (33)");
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

	describe("Performance Test", () => {
		// 130ms
		it("10000随机大数据匹配判断性能测试", () => {
			// Create the matcher manager
			const manager = matchSync<number, string>();

			// Define the matchers
			manager
				.with(is.number().gt(1000).match, (val) => `大于1000：${val}`)
				.with(is.number().lt(10).match, (val) => `小于10：${val}`)
				.otherwise(() => "默认数字");

			// Use matchForEach to handle each item lazily
			const results = manager.forEach(numList, (val, i) => {
				const a = numList[i];
				if (a > 1000) {
					expect(val).toBe(`大于1000：${a}`);
				} else if (a < 10) {
					expect(val).toBe(`小于10：${a}`);
				} else {
					expect(val).toBe("默认数字");
				}
			});
		});
	});
});
