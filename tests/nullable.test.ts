import { describe, it, expect } from "vitest";
import { None } from "../src/instances/option";
import { fromNullable } from "../src/utils/either";

describe("Option.fromNullable", () => {
	it("null returns None", () => {
		expect(None.fromNullable(null).isNone()).toBe(true);
	});

	it("undefined returns None", () => {
		expect(None.fromNullable(undefined).isNone()).toBe(true);
	});

	it("non-null returns Some", () => {
		const result = None.fromNullable(42);
		expect(result.isSome()).toBe(true);
		expect(result.get()).toBe(42);
	});

	it("empty string is Some", () => {
		const result = None.fromNullable("");
		expect(result.isSome()).toBe(true);
		expect(result.get()).toBe("");
	});

	it("zero is Some", () => {
		const result = None.fromNullable(0);
		expect(result.isSome()).toBe(true);
		expect(result.get()).toBe(0);
	});

	it("false is Some", () => {
		const result = None.fromNullable(false);
		expect(result.isSome()).toBe(true);
		expect(result.get()).toBe(false);
	});
});

describe("Either.fromNullable", () => {
	it("null returns Left", () => {
		const check = fromNullable("is null");
		expect(check(null).isLeft()).toBe(true);
		expect(check(null).value).toBe("is null");
	});

	it("undefined returns Left", () => {
		const check = fromNullable("is undefined");
		expect(check(undefined).isLeft()).toBe(true);
	});

	it("non-null returns Right", () => {
		const check = fromNullable("error");
		const result = check(42);
		expect(result.isRight()).toBe(true);
		expect(result.value).toBe(42);
	});

	it("empty string is Right", () => {
		const check = fromNullable("error");
		expect(check("").isRight()).toBe(true);
	});

	it("zero is Right", () => {
		const check = fromNullable("error");
		expect(check(0).isRight()).toBe(true);
	});

	it("works in pipeline", () => {
		const result = fromNullable<string, string>("missing")("hello")
			.map((s) => s.toUpperCase());
		expect(result.value).toBe("HELLO");
	});
});
