import { describe, expect, it } from "vitest";
import { is } from "../src/utils/match/is";

const validate = <T>(s: ReturnType<typeof is.schema<T>>, value: unknown) =>
	s["~standard"].validate(value);

describe("Standard Schema Adapter", () => {
	describe("Spec compliance", () => {
		it("should have vendor 'kaia-fp' and version 1", () => {
			const s = is.schema(is.number().match);
			expect(s["~standard"].vendor).toBe("kaia-fp");
			expect(s["~standard"].version).toBe(1);
		});

		it("success result should have value and no issues", () => {
			const s = is.schema(is.number().match);
			const result = validate(s, 42);
			expect(result).toEqual({ value: 42 });
		});

		it("failure result should have issues array", () => {
			const s = is.schema(is.number().match);
			const result = validate(s, "not a number");
			expect(result).toHaveProperty("issues");
			expect(Array.isArray((result as any).issues)).toBe(true);
		});
	});

	describe("Primitive validation", () => {
		it("number — success", () => {
			const s = is.schema(is.number().match);
			expect(validate(s, 0)).toEqual({ value: 0 });
			expect(validate(s, -3.14)).toEqual({ value: -3.14 });
		});

		it("number — failure", () => {
			const s = is.schema(is.number().match);
			const r = validate(s, "abc") as any;
			expect(r.issues).toHaveLength(1);
			expect(r.issues[0].message).toBe("Invalid value");
		});

		it("string — success", () => {
			const s = is.schema(is.string().match);
			expect(validate(s, "hello")).toEqual({ value: "hello" });
		});

		it("string — failure", () => {
			const s = is.schema(is.string().match);
			expect(validate(s, 123)).toHaveProperty("issues");
		});

		it("boolean — success", () => {
			const s = is.schema(is.boolean().match);
			expect(validate(s, true)).toEqual({ value: true });
			expect(validate(s, false)).toEqual({ value: false });
		});

		it("boolean — failure", () => {
			const s = is.schema(is.boolean().match);
			expect(validate(s, 1)).toHaveProperty("issues");
		});

		it("date — success", () => {
			const s = is.schema(is.date());
			expect(validate(s, new Date())).toHaveProperty("value");
		});

		it("date — failure", () => {
			const s = is.schema(is.date());
			expect(validate(s, "2024-01-01")).toHaveProperty("issues");
		});

		it("bigint — success", () => {
			const s = is.schema(is.bigint());
			expect(validate(s, 100n)).toEqual({ value: 100n });
		});

		it("bigint — failure", () => {
			const s = is.schema(is.bigint());
			expect(validate(s, 100)).toHaveProperty("issues");
		});

		it("literal — success", () => {
			const s = is.schema(is.literal(42).match);
			expect(validate(s, 42)).toEqual({ value: 42 });
		});

		it("literal — failure", () => {
			const s = is.schema(is.literal(42).match);
			expect(validate(s, 43)).toHaveProperty("issues");
		});

		it("literal string — success", () => {
			const s = is.schema(is.literal("active").match);
			expect(validate(s, "active")).toEqual({ value: "active" });
		});
	});

	describe("Constrained primitives", () => {
		it("number gt — success", () => {
			const s = is.schema(is.number().gt(10).match);
			expect(validate(s, 11)).toEqual({ value: 11 });
		});

		it("number gt — failure", () => {
			const s = is.schema(is.number().gt(10).match);
			expect(validate(s, 10)).toHaveProperty("issues");
		});

		it("number gte + lte (range)", () => {
			const s = is.schema(is.number().gte(1).lte(100).match);
			expect(validate(s, 50)).toEqual({ value: 50 });
			expect(validate(s, 0)).toHaveProperty("issues");
			expect(validate(s, 101)).toHaveProperty("issues");
		});

		it("number even", () => {
			const s = is.schema(is.number().even().match);
			expect(validate(s, 4)).toEqual({ value: 4 });
			expect(validate(s, 3)).toHaveProperty("issues");
		});

		it("string test regex", () => {
			const s = is.schema(is.string().test(/^hello/).match);
			expect(validate(s, "hello world")).toEqual({ value: "hello world" });
			expect(validate(s, "goodbye")).toHaveProperty("issues");
		});

		it("string length", () => {
			const s = is.schema(is.string().length(3).match);
			expect(validate(s, "abc")).toEqual({ value: "abc" });
			expect(validate(s, "ab")).toHaveProperty("issues");
		});

		it("string includes", () => {
			const s = is.schema(is.string().includes("@").match);
			expect(validate(s, "a@b.com")).toEqual({ value: "a@b.com" });
			expect(validate(s, "no-at")).toHaveProperty("issues");
		});
	});

	describe("Shape validation with path errors", () => {
		it("all fields valid", () => {
			const s = is.schema(
				is.shape({ name: is.string().match, age: is.number().match }),
			);
			const r = validate(s, { name: "Alice", age: 30 });
			expect(r).toEqual({ value: { name: "Alice", age: 30 } });
		});

		it("single field failure with path", () => {
			const s = is.schema(
				is.shape({ name: is.string().match, age: is.number().match }),
			);
			const r = validate(s, { name: 123, age: 30 }) as any;
			expect(r.issues).toHaveLength(1);
			expect(r.issues[0].path).toEqual([{ key: "name" }]);
			expect(r.issues[0].message).toBe("Invalid value for 'name'");
		});

		it("multiple field failures", () => {
			const s = is.schema(
				is.shape({ name: is.string().match, age: is.number().match }),
			);
			const r = validate(s, { name: 123, age: "old" }) as any;
			expect(r.issues).toHaveLength(2);
			expect(r.issues[0].path).toEqual([{ key: "name" }]);
			expect(r.issues[1].path).toEqual([{ key: "age" }]);
		});

		it("non-object input to shape", () => {
			const s = is.schema(is.shape({ name: is.string().match }));
			const r1 = validate(s, null) as any;
			expect(r1.issues).toHaveLength(1);

			const r2 = validate(s, "string") as any;
			expect(r2.issues).toHaveLength(1);

			const r3 = validate(s, undefined) as any;
			expect(r3.issues).toHaveLength(1);
		});

		it("shape with constrained fields", () => {
			const s = is.schema(
				is.shape({
					email: is.string().test(/@/).match,
					age: is.number().gte(18).match,
				}),
			);
			const r = validate(s, { email: "bad", age: 10 }) as any;
			expect(r.issues).toHaveLength(2);
		});
	});

	describe("Nested shape paths", () => {
		it("nested shape produces compound paths", () => {
			const addressShape = is.shape({
				street: is.string().match,
				zip: is.string().test(/^\d{5}$/).match,
			});
			const s = is.schema(
				is.shape({
					name: is.string().match,
					address: addressShape,
				}),
			);
			const r = validate(s, {
				name: "Alice",
				address: { street: 123, zip: "abc" },
			}) as any;
			expect(r.issues).toHaveLength(2);
			expect(r.issues[0].path).toEqual([{ key: "address" }, { key: "street" }]);
			expect(r.issues[0].message).toBe("Invalid value for 'address.street'");
			expect(r.issues[1].path).toEqual([{ key: "address" }, { key: "zip" }]);
		});

		it("nested shape valid passes through", () => {
			const s = is.schema(
				is.shape({
					name: is.string().match,
					address: is.shape({
						street: is.string().match,
					}),
				}),
			);
			const r = validate(s, {
				name: "Bob",
				address: { street: "Main St" },
			});
			expect(r).toEqual({
				value: { name: "Bob", address: { street: "Main St" } },
			});
		});
	});

	describe("Optional fields", () => {
		it("optional field accepts undefined", () => {
			const s = is.schema(
				is.shape({
					name: is.string().match,
					nickname: is.optional(is.string().match),
				}),
			);
			const r = validate(s, { name: "Alice" });
			expect(r).toEqual({ value: { name: "Alice" } });
		});

		it("optional field rejects invalid value", () => {
			const s = is.schema(
				is.shape({
					nickname: is.optional(is.string().match),
				}),
			);
			const r = validate(s, { nickname: 123 }) as any;
			expect(r.issues).toHaveLength(1);
			expect(r.issues[0].path).toEqual([{ key: "nickname" }]);
		});
	});

	describe("Union and Tuple", () => {
		it("union — one branch matches", () => {
			const s = is.schema(is.union(is.string().match, is.number().match));
			expect(validate(s, "hello")).toEqual({ value: "hello" });
			expect(validate(s, 42)).toEqual({ value: 42 });
		});

		it("union — no branch matches", () => {
			const s = is.schema(is.union(is.string().match, is.number().match));
			expect(validate(s, true)).toHaveProperty("issues");
		});

		it("tuple — success", () => {
			const s = is.schema(is.tuple([is.string().match, is.number().match]));
			expect(validate(s, ["hello", 42])).toEqual({ value: ["hello", 42] });
		});

		it("tuple — failure", () => {
			const s = is.schema(is.tuple([is.string().match, is.number().match]));
			expect(validate(s, [42, "hello"])).toHaveProperty("issues");
		});
	});

	describe("Custom messageFactory", () => {
		it("uses custom message for flat predicate", () => {
			const s = is.schema(is.number().match, {
				messageFactory: (val) => `Expected number, got ${typeof val}`,
			});
			const r = validate(s, "abc") as any;
			expect(r.issues[0].message).toBe("Expected number, got string");
		});

		it("uses custom message with path for shape fields", () => {
			const s = is.schema(is.shape({ age: is.number().match }), {
				messageFactory: (val, path) =>
					`Field '${path.join(".")}' invalid: ${typeof val}`,
			});
			const r = validate(s, { age: "old" }) as any;
			expect(r.issues[0].message).toBe("Field 'age' invalid: string");
		});
	});

	describe("Shape extends", () => {
		it("validates merged shape", () => {
			const base = is.shape({ id: is.number().match });
			const extended = base.extends(is.shape({ name: is.string().match }));
			const s = is.schema(extended);
			expect(validate(s, { id: 1, name: "Alice" })).toEqual({
				value: { id: 1, name: "Alice" },
			});
		});

		it("fails on missing extended field", () => {
			const base = is.shape({ id: is.number().match });
			const extended = base.extends(is.shape({ name: is.string().match }));
			const s = is.schema(extended);
			const r = validate(s, { id: 1, name: 123 }) as any;
			expect(r.issues).toHaveLength(1);
			expect(r.issues[0].path).toEqual([{ key: "name" }]);
		});
	});

	describe("Edge cases", () => {
		it("validate accepts unknown input without throwing", () => {
			const s = is.schema(is.number().match);
			expect(() => validate(s, undefined)).not.toThrow();
			expect(() => validate(s, Symbol())).not.toThrow();
			expect(() => validate(s, () => {})).not.toThrow();
		});

		it("clazz predicate", () => {
			class Foo {}
			const s = is.schema(is.clazz(Foo));
			expect(validate(s, new Foo())).toHaveProperty("value");
			expect(validate(s, {})).toHaveProperty("issues");
		});
	});
});
