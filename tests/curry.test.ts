import { describe } from "node:test";
import { expect, it } from "vitest";
import { _, curry } from "../src/utils/pipe/curry";
const addBasic = (a: number, b: number, c: number) => a + b + c;
const add = curry(addBasic);

describe("模拟实际场景测试", () => {
	it("add", () => {
		const a = add(1)(2, 3);
		const b = add(1, 2, 3);
		const e = add(1, _, 3)(2);
		const f = add(_)(2)(3)(1);
		const g = add(_)(2, _, 3)(1);
		const h = add(1)(2)(3);
		const d = add(_, 2, 3);
		// const a = addBasic(1, 2, 3);
		// const b = addBasic(1, 2, 3);
		// const e = addBasic(1, 2, 3);
		// const f = addBasic(1, 2, 3);
		// const g = addBasic(1, 2, 3);
		// const h = addBasic(1, 2, 3);
		// const d = (a: number) => addBasic(a, 2, 3);
		expect(a).toBe(6);
		expect(b).toBe(6);
		expect(e).toBe(6);
		expect(f).toBe(6);
		expect(g).toBe(6);
		expect(h).toBe(6);
		expect(d(1)).toBe(6);
	});
});
