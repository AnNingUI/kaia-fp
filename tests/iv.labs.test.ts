import { iw } from "labs/utils/with";
import { describe, expect, it } from "vitest";

describe("Labs - initWith", () => {
	it("also", () => {
		let _;
		const a = iw({} as any).also((self) => {
			self["0"] = 0;
			_ = self;
		});
		console.log([_, a]);
		expect(a).not.toEqual(_);
	});
	it("let", () => {
		let _;
		const a = iw({} as any).let((self) => {
			self["0"] = 0;
			_ = self;
		});
		console.log([_, a]);
		expect(a).toEqual(_);
	});
});
