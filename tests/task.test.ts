import { describe, it, expect, vi } from "vitest";
import { Task, TaskMonad } from "../src/instances/task";

describe("Task", () => {
	describe("basic", () => {
		it("of wraps a pure value", async () => {
			const t = Task.of(42);
			expect(await t.run()).toBe(42);
		});

		it("constructor defers execution", () => {
			const fn = vi.fn(() => Promise.resolve(42));
			const t = new Task(fn);
			expect(fn).not.toHaveBeenCalled();
			t.run();
			expect(fn).toHaveBeenCalledTimes(1);
		});
	});

	describe("fromPromise", () => {
		it("wraps an existing promise", async () => {
			const p = Promise.resolve(10);
			const t = Task.fromPromise(p);
			expect(await t.run()).toBe(10);
		});

		it("propagates rejection", async () => {
			const p = Promise.reject(new Error("fail"));
			const t = Task.fromPromise(p);
			await expect(t.run()).rejects.toThrow("fail");
		});
	});

	describe("reject", () => {
		it("creates a failed task", async () => {
			const t = Task.reject(new Error("oops"));
			await expect(t.run()).rejects.toThrow("oops");
		});
	});

	describe("all", () => {
		it("resolves all tasks", async () => {
			const tasks = [Task.of(1), Task.of(2), Task.of(3)];
			expect(await Task.all(tasks).run()).toEqual([1, 2, 3]);
		});

		it("rejects if any task rejects", async () => {
			const tasks = [
				Task.of(1),
				Task.reject(new Error("fail")),
				Task.of(3),
			];
			await expect(Task.all(tasks).run()).rejects.toThrow("fail");
		});
	});

	describe("race", () => {
		it("resolves with the first settled task", async () => {
			const slow = new Task(
				() => new Promise((r) => setTimeout(() => r("slow"), 100))
			);
			const fast = new Task(
				() => new Promise((r) => setTimeout(() => r("fast"), 10))
			);
			expect(await Task.race([slow, fast]).run()).toBe("fast");
		});
	});

	describe("map", () => {
		it("transforms the result", async () => {
			const t = Task.of(5).map((x) => x * 2);
			expect(await t.run()).toBe(10);
		});

		it("chains multiple maps", async () => {
			const t = Task.of(1)
				.map((x) => x + 1)
				.map((x) => x * 3)
				.map((x) => `result: ${x}`);
			expect(await t.run()).toBe("result: 6");
		});
	});

	describe("flatMap", () => {
		it("chains async computations", async () => {
			const t = Task.of(5).flatMap((x) => Task.of(x * 2));
			expect(await t.run()).toBe(10);
		});

		it("chains with real async", async () => {
			const t = Task.of("hello").flatMap((s) =>
				new Task(() => Promise.resolve(s.toUpperCase()))
			);
			expect(await t.run()).toBe("HELLO");
		});
	});

	describe("ap", () => {
		it("applies a function in Task to a value in Task", async () => {
			const fab = Task.of((a: number) => a + 10);
			const fa = Task.of(5);
			expect(await fa.ap(fab).run()).toBe(15);
		});

		it("runs concurrently", async () => {
			const order: number[] = [];
			const slow = new Task(
				() =>
					new Promise<number>((r) =>
						setTimeout(() => {
							order.push(1);
							r(10);
						}, 50)
					)
			);
			const fastFn = new Task(
				() =>
					new Promise<(a: number) => number>((r) =>
						setTimeout(() => {
							order.push(2);
							r((a: number) => a + 1);
						}, 10)
					)
			);
			const result = slow.ap(fastFn);
			expect(await result.run()).toBe(11);
		});
	});

	describe("recover", () => {
		it("recovers from a failed task", async () => {
			const t = Task.reject(new Error("fail")).recover(() => 42);
			expect(await t.run()).toBe(42);
		});

		it("passes through on success", async () => {
			const t = Task.of(10).recover(() => 42);
			expect(await t.run()).toBe(10);
		});
	});

	describe("recoverWith", () => {
		it("recovers with another task", async () => {
			const t = Task.reject(new Error("fail")).recoverWith(() =>
				Task.of(99)
			);
			expect(await t.run()).toBe(99);
		});

		it("passes through on success", async () => {
			const t = Task.of(10).recoverWith(() => Task.of(99));
			expect(await t.run()).toBe(10);
		});
	});

	describe("monad laws", () => {
		it("left identity: of(a).flatMap(f) === f(a)", async () => {
			const f = (x: number) => Task.of(x * 2);
			expect(await Task.of(5).flatMap(f).run()).toBe(await f(5).run());
		});

		it("right identity: m.flatMap(of) === m", async () => {
			const m = Task.of(5);
			expect(await m.flatMap(Task.of).run()).toBe(await m.run());
		});

		it("associativity", async () => {
			const m = Task.of(5);
			const f = (x: number) => Task.of(x + 1);
			const g = (x: number) => Task.of(x * 3);

			const lhs = await m.flatMap(f).flatMap(g).run();
			const rhs = await m.flatMap((a) => f(a).flatMap(g)).run();
			expect(lhs).toBe(rhs);
		});
	});

	describe("TaskMonad", () => {
		it("map", async () => {
			const result = TaskMonad.map(Task.of(5), (x) => x * 2);
			expect(await result.run()).toBe(10);
		});

		it("of", async () => {
			const result = TaskMonad.of(42);
			expect(await result.run()).toBe(42);
		});

		it("flatMap", async () => {
			const result = TaskMonad.flatMap(Task.of(5), (x) =>
				Task.of(x * 2)
			);
			expect(await result.run()).toBe(10);
		});
	});
});
