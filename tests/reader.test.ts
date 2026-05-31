import { describe, it, expect } from "vitest";
import { Reader, ReaderMonad, ask, asks } from "../src/instances/reader";

describe("Reader", () => {
	describe("basic", () => {
		it("of wraps a pure value", () => {
			const r = Reader.of<string, number>(42);
			expect(r.run("env")).toBe(42);
		});

		it("ask returns the environment", () => {
			const r = ask<{ name: string }>();
			expect(r.run({ name: "alice" })).toEqual({ name: "alice" });
		});

		it("asks applies a function to the environment", () => {
			const r = asks<{ name: string }, string>((env) => env.name.toUpperCase());
			expect(r.run({ name: "alice" })).toBe("ALICE");
		});
	});

	describe("map", () => {
		it("transforms the result", () => {
			const r = Reader.of<string, number>(5).map((x) => x * 2);
			expect(r.run("env")).toBe(10);
		});

		it("chains multiple maps", () => {
			const r = Reader.of<string, number>(1)
				.map((x) => x + 1)
				.map((x) => x * 3);
			expect(r.run("env")).toBe(6);
		});
	});

	describe("flatMap", () => {
		it("chains readers", () => {
			const r = ask<{ host: string }>().flatMap((env) =>
				Reader.of<{ host: string }, string>(`http://${env.host}`)
			);
			expect(r.run({ host: "example.com" })).toBe("http://example.com");
		});

		it("shares environment across chain", () => {
			const r = ask<{ a: number; b: number }>()
				.flatMap((env) => Reader.of(env.a + env.b))
				.flatMap((sum) => Reader.of(sum * 2));
			expect(r.run({ a: 3, b: 4 })).toBe(14);
		});
	});

	describe("ap", () => {
		it("applies a function in Reader to a value in Reader", () => {
			const add = (a: number) => (b: number) => a + b;
			const fab = Reader.of<string, (a: number) => number>(add(10));
			const fa = Reader.of<string, number>(5);
			expect(fa.ap(fab).run("env")).toBe(15);
		});
	});

	describe("local", () => {
		it("modifies the environment for inner computation", () => {
			interface Config {
				prefix: string;
				name: string;
			}
			const r = ask<Config>()
				.map((env) => `${env.prefix}: ${env.name}`)
				.local((env: Config) => ({ ...env, prefix: env.prefix.toUpperCase() }));

			expect(r.run({ prefix: "hello", name: "world" })).toBe("HELLO: world");
		});
	});

	describe("monad laws", () => {
		it("left identity: of(a).flatMap(f) === f(a)", () => {
			const f = (x: number) => Reader.of<string, number>(x * 2);
			expect(Reader.of<string, number>(5).flatMap(f).run("env")).toBe(
				f(5).run("env")
			);
		});

		it("right identity: m.flatMap(of) === m", () => {
			const m = Reader.of<string, number>(5);
			expect(m.flatMap(Reader.of).run("env")).toBe(m.run("env"));
		});

		it("associativity: m.flatMap(f).flatMap(g) === m.flatMap(a => f(a).flatMap(g))", () => {
			const m = Reader.of<string, number>(5);
			const f = (x: number) => Reader.of<string, number>(x + 1);
			const g = (x: number) => Reader.of<string, number>(x * 3);

			const lhs = m.flatMap(f).flatMap(g).run("env");
			const rhs = m.flatMap((a) => f(a).flatMap(g)).run("env");
			expect(lhs).toBe(rhs);
		});
	});

	describe("ReaderMonad", () => {
		it("map", () => {
			const result = ReaderMonad.map(Reader.of(5), (x) => x * 2);
			expect(result.run("env")).toBe(10);
		});

		it("of", () => {
			const result = ReaderMonad.of(42);
			expect(result.run("env")).toBe(42);
		});

		it("flatMap", () => {
			const result = ReaderMonad.flatMap(Reader.of(5), (x) =>
				Reader.of(x * 2)
			);
			expect(result.run("env")).toBe(10);
		});
	});

	describe("practical", () => {
		it("dependency injection", () => {
			interface Deps {
				db: { query: (sql: string) => string };
				logger: { log: (msg: string) => void };
			}

			const logs: string[] = [];
			const deps: Deps = {
				db: { query: (sql: string) => `result:${sql}` },
				logger: { log: (msg: string) => logs.push(msg) },
			};

			const program = ask<Deps>()
				.flatMap((env) => {
					env.logger.log("querying");
					return Reader.of(env.db.query("SELECT *"));
				})
				.map((result) => result.toUpperCase());

			expect(program.run(deps)).toBe("RESULT:SELECT *");
			expect(logs).toEqual(["querying"]);
		});
	});
});
