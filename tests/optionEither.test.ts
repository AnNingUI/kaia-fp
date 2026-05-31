import { describe, it, expect } from "vitest";
import { Some, None, Options } from "../src/instances/option";
import { Left, Right } from "../src/utils/either";

describe("Option.ap", () => {
	it("Some function applied to Some value", () => {
		const fab = new Some((x: number) => x * 2);
		const fa = new Some(5);
		expect(fa.ap(fab).get()).toBe(10);
	});

	it("None function returns None", () => {
		const fa = new Some(5);
		expect(fa.ap(None.of() as Options<(x: number) => number>).isNone()).toBe(true);
	});

	it("None value returns None", () => {
		const fab = new Some((x: number) => x * 2);
		expect((None.of() as Options<number>).ap(fab).isNone()).toBe(true);
	});

	it("both None returns None", () => {
		expect(
			(None.of() as Options<number>).ap(
				None.of() as Options<(x: number) => number>
			).isNone()
		).toBe(true);
	});

	it("chaining ap", () => {
		const add = (a: number) => (b: number) => a + b;
		const fab = new Some(add(10));
		const fa = new Some(5);
		expect(fa.ap(fab).get()).toBe(15);
	});
});

describe("Either.bimap", () => {
	it("maps Right with g", () => {
		const r = new Right(5).bimap(
			(l: string) => l.toUpperCase(),
			(x) => x * 2
		);
		expect(r.isRight()).toBe(true);
		expect(r.value).toBe(10);
	});

	it("maps Left with f", () => {
		const l = new Left("error").bimap(
			(s) => s.toUpperCase(),
			(x: number) => x * 2
		);
		expect(l.isLeft()).toBe(true);
		expect(l.value).toBe("ERROR");
	});

	it("preserves Right when Left is mapped", () => {
		const r = new Right(42).bimap(
			() => "should not run",
			(x) => x + 1
		);
		expect(r.value).toBe(43);
	});

	it("preserves Left when Right is mapped", () => {
		const l = new Left("err").bimap(
			(s) => s + "!",
			() => 0
		);
		expect(l.value).toBe("err!");
	});

	it("chains with map", () => {
		const result = new Right(5)
			.bimap(
				(l: string) => l,
				(x) => x * 2
			)
			.map((x) => x + 1);
		expect(result.value).toBe(11);
	});
});
