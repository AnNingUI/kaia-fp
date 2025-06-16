import { describe } from "node:test";
import { expect, it } from "vitest";
import {
	_,
	curry,
	curryVariadic,
	curryWithDefault,
} from "../src/utils/pipe/curry";
const addBasic = (a: number, b: number, c: number) => a + b + c;
const add = curry(addBasic);
const max = curryVariadic(Math.max);
function greet(name: string, prefix = "Hi", suffix = "!") {
	return `${prefix} ${name}${suffix}`;
}

const cg = curryWithDefault(greet);

describe("模拟实际场景测试", () => {
	it("add", () => {
		const a = add(1)(2, 3);
		const b = add(1, 2, 3);
		const e = add(1, _, 3)(2);
		const f = add(_)(2)(3)(1);
		const g = add(_)(2, _, 3)(1);
		const h = add(1)(2)(3);
		const d = add(_, 2, 3);

		// Can not use _ in the argument
		const u = max(1)(2)(3).exec();
		const i = max(1, 2, 3).exec();
		const j = cg("Alice").exec();
		const k = cg("Bob", "Hello").exec();
		const l = cg("Bob", "Mr.", "?").exec();
		const m = cg(_, "Mr.", "?")("Bob").exec();
		const n = cg("Bob")("Mr.", "?").exec();
		const o = cg("Bob", _, "?")("Mr.").exec();
		const p = cg("Bob", "Mr.")("?").exec();

		expect(a).toBe(6);
		expect(b).toBe(6);
		expect(e).toBe(6);
		expect(f).toBe(6);
		expect(g).toBe(6);
		expect(h).toBe(6);
		expect(d(1)).toBe(6);
		expect(u).toBe(3);
		expect(i).toBe(3);
		expect(j).toBe("Hi Alice!");
		expect(k).toBe("Hello Bob!");
		expect(l).toBe("Mr. Bob?");
		expect(m).toBe("Mr. Bob?");
		expect(n).toBe("Mr. Bob?");
		expect(o).toBe("Mr. Bob?");
		expect(p).toBe("Mr. Bob?");
	});
});

// exp:

// async function baseFetch<T>(
// 	baseUrl: string,
// 	apiUrl: string,
// 	options: RequestInit = {}
// ): Promise<T> {
// 	const response = await fetch(baseUrl + apiUrl, options);
// 	if (!response.ok) {
// 		throw new Error(`Network response was not ok: ${response.status}`);
// 	}
// 	return response.json();
// }

// const createEasyFetch = curry(baseFetch);
// const easyFetchMain = createEasyFetch("http://localhost:3000/");
// const easyFetchFile = createEasyFetch("http://10.22.19.177:3000");

// interface AvatarI {
// 	image: Blob;
// 	pathPrefix: string;
// }
// interface AvatarO {
// 	url: string;
// }

// async function uploadAvatar(img: AvatarI) {
// 	// <- ReturnType is Promise<AvatarO>
// 	const formData = new FormData();
// 	formData.append("image", img.image);
// 	formData.append("pathPrefix", img.pathPrefix);
// 	return easyFetchFile<AvatarO>("/api/create", {
// 		method: "POST",
// 		body: formData,
// 	});
// }
// const createEasyFetchWithDefault = curryWithDefault(baseFetch);
// const easyFetchMainWithDefault = createEasyFetchWithDefault(
// 	_,
// 	_,
// 	"http://localhost:3000/"
// );
// const easyFetchFileWithDefault = createEasyFetchWithDefault(
// 	_,
// 	_,
// 	"http://10.22.19.177:3000"
// );

// export function uploadAvatar(img: AvatarI) {
// 	// <- ReturnType is Promise<AvatarO>
// 	const formData = new FormData();
// 	formData.append("image", img.image);
// 	formData.append("pathPrefix", img.pathPrefix);
// 	return easyFetchFileWithDefault<AvatarO>("/api/create", {
// 		method: "POST",
// 		body: formData,
// 	});
// }

// const result = uploadAvatar({
// 	image: new Blob(["test"], { type: "text/plain" }),
// 	pathPrefix: "test",
// });
// const a = result.exec(); // <- returns Promise<AvatarO>
