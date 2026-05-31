import { describe, it, expect, vi } from "vitest";
import { IO, IOMonad } from "../src/instances/io";

describe("IO", () => {
	describe("basic", () => {
		it("of wraps a pure value", () => {
			const io = IO.of(42);
			expect(io.run()).toBe(42);
		});

		it("constructor defers execution", () => {
			const fn = vi.fn(() => 42);
			const io = new IO(fn);
			expect(fn).not.toHaveBeenCalled();
			io.run();
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("run executes the effect each time", () => {
			let count = 0;
			const io = new IO(() => ++count);
			expect(io.run()).toBe(1);
			expect(io.run()).toBe(2);
			expect(io.run()).toBe(3);
		});
	});

	describe("map", () => {
		it("transforms the result", () => {
			const io = IO.of(5).map((x) => x * 2);
			expect(io.run()).toBe(10);
		});

		it("is lazy", () => {
			const fn = vi.fn((x: number) => x * 2);
			const io = IO.of(5).map(fn);
			expect(fn).not.toHaveBeenCalled();
			io.run();
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("chains multiple maps", () => {
			const io = IO.of(1)
				.map((x) => x + 1)
				.map((x) => x * 3)
				.map((x) => `result: ${x}`);
			expect(io.run()).toBe("result: 6");
		});
	});

	describe("flatMap", () => {
		it("chains IO computations", () => {
			const io = IO.of(5).flatMap((x) => IO.of(x * 2));
			expect(io.run()).toBe(10);
		});

		it("is lazy", () => {
			const fn = vi.fn((x: number) => IO.of(x * 2));
			const io = IO.of(5).flatMap(fn);
			expect(fn).not.toHaveBeenCalled();
			io.run();
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("chains multiple flatMaps", () => {
			const io = IO.of(1)
				.flatMap((x) => IO.of(x + 1))
				.flatMap((x) => IO.of(x * 3));
			expect(io.run()).toBe(6);
		});
	});

	describe("ap", () => {
		it("applies a function in IO to a value in IO", () => {
			const add = (a: number) => (b: number) => a + b;
			const fab = IO.of(add(10));
			const fa = IO.of(5);
			expect(fa.ap(fab).run()).toBe(15);
		});

		it("is lazy", () => {
			const fnFab = vi.fn(() => (x: number) => x * 2);
			const fnFa = vi.fn(() => 5);
			const result = new IO(fnFa).ap(new IO(fnFab));
			expect(fnFab).not.toHaveBeenCalled();
			expect(fnFa).not.toHaveBeenCalled();
			result.run();
			expect(fnFab).toHaveBeenCalledTimes(1);
			expect(fnFa).toHaveBeenCalledTimes(1);
		});
	});

	describe("monad laws", () => {
		it("left identity: of(a).flatMap(f) === f(a)", () => {
			const f = (x: number) => IO.of(x * 2);
			expect(IO.of(5).flatMap(f).run()).toBe(f(5).run());
		});

		it("right identity: m.flatMap(of) === m", () => {
			const m = IO.of(5);
			expect(m.flatMap(IO.of).run()).toBe(m.run());
		});

		it("associativity: m.flatMap(f).flatMap(g) === m.flatMap(a => f(a).flatMap(g))", () => {
			const m = IO.of(5);
			const f = (x: number) => IO.of(x + 1);
			const g = (x: number) => IO.of(x * 3);

			const lhs = m.flatMap(f).flatMap(g).run();
			const rhs = m.flatMap((a) => f(a).flatMap(g)).run();
			expect(lhs).toBe(rhs);
		});
	});

	describe("IOMonad", () => {
		it("map", () => {
			const result = IOMonad.map(IO.of(5), (x) => x * 2);
			expect(result.run()).toBe(10);
		});

		it("of", () => {
			const result = IOMonad.of(42);
			expect(result.run()).toBe(42);
		});

		it("flatMap", () => {
			const result = IOMonad.flatMap(IO.of(5), (x) => IO.of(x * 2));
			expect(result.run()).toBe(10);
		});
	});

	describe("practical", () => {
		it("deferred side effect", () => {
			const log: string[] = [];
			const io = new IO(() => {
				log.push("executed");
				return log.length;
			});

			expect(log).toEqual([]);
			const result = io.run();
			expect(result).toBe(1);
			expect(log).toEqual(["executed"]);
		});

		it("composing IO with side effects", () => {
			let counter = 0;
			const increment = new IO(() => ++counter);
			const read = new IO(() => counter);

			const program = increment
				.flatMap(() => increment)
				.flatMap(() => increment)
				.flatMap(() => read);

			expect(counter).toBe(0);
			expect(program.run()).toBe(3);
			expect(counter).toBe(3);
		});
	});
});
