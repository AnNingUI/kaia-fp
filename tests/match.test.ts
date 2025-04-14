// tests/realScenario.test.ts
import { defineShape, getShape, is, match } from "index";
import { describe, expect, it } from "vitest";
//
// 模拟真实业务场景：用户数据处理、异步请求、日志记录与状态更新
//

describe("模拟实际场景测试", () => {
	describe("Match Functionality", () => {
		// 数字匹配和条件
		it("should match numbers with conditions", async () => {
			const result = await match<unknown, string>()
				.with(is.number().eq(42).match, (n) => `等于42：${n}`)
				.with(is.number().gt(100).match, (n) => `大于100：${n}`)
				.with(is.number().lt(50).match, (n) => `小于50：${n}`)
				.otherwise(() => "未知数字")
				.run(42);

			expect(result).toBe("等于42：42");
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
			defineShape(
				"Person",
				is.shape({
					name: is.string().match,
					age: is.optional(is.number().gt(0).match),
				})
			);

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
});
