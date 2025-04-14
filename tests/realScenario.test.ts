// tests/realScenario.test.ts
import { describe, expect, it } from "vitest";
import { AsyncResult, AsyncResultMonad } from "../src/instances/asyncResult";
import { IO, IOMonad } from "../src/instances/io";
import { OptionMonad, type Options } from "../src/instances/option";
import { Reader } from "../src/instances/reader";
import { State, StateMonad } from "../src/instances/state";
import { Task, TaskMonad } from "../src/instances/task";
import { Writer, WriterMonad } from "../src/instances/writer";
import { Left } from "../src/utils/either";

//
// 模拟真实业务场景：用户数据处理、异步请求、日志记录与状态更新
//

describe("模拟实际场景测试", () => {
	// 模拟通过 Option 实现用户数据查询
	describe("OptionMonad - 用户数据查询", () => {
		type User = {
			id: number;
			name: string;
		};
		// 模拟从数据库查询用户，若 id===1 则存在，否则返回 None
		const getUserById = (id: number): Options<User> =>
			id === 1 ? OptionMonad.of({ id: 1, name: "Alice" }) : OptionMonad.none();

		it("存在的用户应返回正确的名字大写", () => {
			let userOption = getUserById(1);
			const result = OptionMonad.map(userOption, (user) =>
				user.name.toUpperCase()
			);
			// 通过判断 _tag 测试 Some 分支
			if (result.isSome()) {
				expect(result.value).toBe("ALICE");
			} else {
				throw new Error("Expected a Some instance");
			}
		});
	});

	// 模拟 Task 处理异步数据请求
	describe("TaskMonad - 异步数据请求", () => {
		it("应能正确计算异步请求结果", async () => {
			// 模拟异步请求返回一个数字
			const fetchData = new Task(() => Promise.resolve(10));
			// 通过 TaskMonad 组合异步计算
			const computation = TaskMonad.flatMap(fetchData, (num) =>
				TaskMonad.of(num * 2)
			);
			const result = await computation.run();
			expect(result).toBe(20);
		});
	});

	// 模拟 IO 进行延迟执行操作
	describe("IOMonad - 延迟计算", () => {
		it("计算应延迟执行且返回预期值", () => {
			const computeIO = IO.of(5);
			const resultIO = IOMonad.map(computeIO, (n) => n + 3);
			// 只有调用 run 方法时才执行计算
			expect(resultIO.run()).toBe(8);
		});
	});

	// 模拟 State 实现计数器状态更新
	describe("StateMonad - 状态更新计数器", () => {
		it("应能正确更新状态", () => {
			// 初始状态为 0
			const initialState = 0;
			// 状态计算，累计加上一个常量 1
			const addOne = new State<number, number>((s) => [1, s + 1]);
			// 连续执行两次加操作
			const combined = StateMonad.flatMap(addOne, () => addOne);
			const [finalValue, finalState] = combined.run(initialState);
			// 最终计算值依然是 1（因为我们没有将两次结果相加，仅测试状态更新）
			expect(finalValue).toBe(1);
			// 状态应累加两次
			expect(finalState).toBe(2);
		});
	});

	// 模拟 Writer 记录执行日志
	describe("WriterMonad - 日志记录", () => {
		it("应在计算过程中记录日志", () => {
			const monoid = { empty: "", concat: (w1: string, w2: string) => w1 + w2 };
			const writerMonad = WriterMonad(monoid);
			// 模拟一个计算：输入数字加倍，并记录过程
			const computation = writerMonad.flatMap(writerMonad.of(5), (n) => {
				const doubled = n * 2;
				const log = `Doubled ${n} to ${doubled}. `;
				return new Writer(doubled, log, monoid);
			});
			expect(computation.value).toBe(10);
			expect(computation.log).toContain("Doubled");
		});
	});

	// 模拟 Reader 读取环境配置
	describe("ReaderMonad - 配置读取", () => {
		it("应能根据注入配置返回正确信息", () => {
			type Config = { apiEndpoint: string };
			// Reader 从环境中读取配置，并格式化一个信息字符串
			const apiReader: Reader<Config, string> = new Reader(
				(config) => `Fetching from ${config.apiEndpoint}`
			);
			const config: Config = { apiEndpoint: "https://example.com/api" };
			const message = apiReader.run(config);
			expect(message).toBe("Fetching from https://example.com/api");
		});
	});

	// 模拟 AsyncResult 处理异步操作的错误与成功案例
	describe("AsyncResultMonad - 异步错误处理", () => {
		it("成功场景应返回 Right 包裹的值", async () => {
			const successOp = AsyncResultMonad.of(100);
			const result = await successOp.run();
			// Right 分支表示成功
			const right = result.isRight();
			expect(right).toBe(true);
			if (right) {
				expect(result.value).toBe(100);
			}
		});

		it("失败场景应返回 Left", async () => {
			// 模拟一个异步操作失败，构造一个 Left
			const failureOp = new AsyncResult<string, number>(() =>
				Promise.resolve(new Left("Error occurred"))
			);
			const result = await failureOp.run();
			expect(result.isLeft()).toBe(true);
		});
	});
});
