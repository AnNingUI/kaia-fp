import {
	deepCloneIterative,
	StructuredCloneFn,
	structuredClonePolyfill,
} from "./structuredClonePolyfill";
class With<T> {
	private obj: {
		_n: T;
		_c?: T;
	};

	private cloneFn!: StructuredCloneFn;

	constructor(obj: T, cloneFn: StructuredCloneFn) {
		this.obj = {
			_n: obj,
			_c: undefined,
		};
		this.cloneFn = cloneFn;
	}

	private get now() {
		return this.obj._c ?? this.obj._n;
	}

	let<R>(fn: (it: T) => R): this {
		fn(this.now);
		return this; // 使用 this 以支持链式调用
	}

	also(fn: (it: T) => void): this {
		const clone = this.cloneFn(this.now);
		fn(clone);
		return this; // 使用 this 以支持链式调用
	}

	produce(fn: (it: T) => void): this {
		const clone = this.cloneFn(this.now);
		fn(clone);
		this.obj._c = clone;
		return this; // 使用 this 以支持链式调用
	}

	async letAsync<R>(fn: (it: T) => Promise<R>): Promise<this> {
		await fn(this.now);
		return this; // 使用 this 以支持链式调用
	}

	async alsoAsync(fn: (it: T) => Promise<void>): Promise<this> {
		const clone = this.cloneFn(this.now);
		await fn(clone);
		return this; // 使用 this 以支持链式调用
	}

	get oValue() {
		return this.obj._n;
	}

	get nValue() {
		return this.now;
	}
}
export function initWith<T>(
	obj: T,
	cloneFn: StructuredCloneFn = structuredClonePolyfill
) {
	return {
		let<R>(fn: (it: T) => R): R extends void ? T : R {
			const result = fn(obj);
			return (result === undefined ? obj : result) as R extends void ? T : R;
		},
		also(fn: (it: T) => void): T {
			const clone = cloneFn(obj);
			fn(clone);
			return obj;
		},
		produce(fn: (it: T) => void): T {
			const clone = cloneFn(obj);
			fn(clone);
			return clone;
		},
		async letAsync<R>(
			fn: (it: T) => Promise<R>
		): Promise<R extends void ? T : R> {
			// return await fn(obj).then(() => obj);
			const result = await fn(obj);
			return (result === undefined ? obj : result) as R extends void ? T : R;
		},
		async alsoAsync(fn: (it: T) => Promise<void>): Promise<T> {
			const clone = cloneFn(obj);
			return await fn(clone).then(() => obj);
		},
		async produceAsync(fn: (it: T) => Promise<void>): Promise<T> {
			const clone = cloneFn(obj);
			return await fn(clone).then(() => clone);
		},
		// 实现链式调用
		get taskMod() {
			return new With(obj, cloneFn);
		},
	};
}

/**
 * @alias initWith
 */
export const iw = initWith;

export function also<T>(
	v: T,
	fn: (it: T) => void,
	cloneFn: StructuredCloneFn = structuredClonePolyfill
) {
	const clone = cloneFn(v);
	fn(clone);
	return v;
}

export function lett<T, R>(v: T, fn: (it: T) => R): R extends void ? T : R {
	const result = fn(v);
	// 使用类型断言来明确返回类型
	return (result === undefined ? v : result) as R extends void ? T : R;
}

export async function alsoAsync<T>(
	v: T,
	fn: (it: T) => Promise<void>,
	cloneFn: StructuredCloneFn = structuredClonePolyfill
): Promise<T> {
	const clone = cloneFn(v);
	return fn(clone).then(() => v);
}

export async function letAsync<T, R>(
	v: T,
	fn: (it: T) => Promise<R>
): Promise<R extends void ? T : R> {
	const result = await fn(v);
	// 使用类型断言来明确返回类型
	return (result === undefined ? v : result) as R extends void ? T : R;
}

// const obj = {
// 	nested: { deeply: { nested: { value: "test" } } },
// 	array: [1, 2, [3, 4, [5, 6]]],
// 	date: new Date(),
// 	regex: /test/gi,
// 	map: new Map([["key", "value"]]),
// 	set: new Set([1, 2, 3]),
// };
// console.time("deepCloneIterative");
// const w = iw(obj, deepCloneIterative);
// let c;
// for (let i = 0; i < 100_0000; i++) {
// 	const v = w.also((it) => {
// 		if (it.map && typeof it.map.set === 'function') {
// 			it.map.set("key", "value2");
// 		}
// 	});
// 	if (i === 100_0000 - 1) {
// 		c = v;
// 	}
// }
// console.timeEnd("deepCloneIterative");
// console.log(obj === c);

// const obj2 = {
// 	nested: { deeply: { nested: { value: "test" } } },
// 	array: [1, 2, [3, 4, [5, 6]]],
// 	date: new Date(),
// 	regex: /test/gi,
// 	map: new Map([["key", "value"]]),
// 	set: new Set([1, 2, 3]),
// };
// console.time("structuredClone");
// const w2 = iw(obj2);
// let c2;
// for (let i = 0; i < 100_0000; i++) {
// 	const v = w2.also((it) => {
// 		if (it.map && typeof it.map.set === 'function') {
// 			it.map.set("key", "value2");
// 		}
// 	});
// 	if (i === 100_0000 - 1) {
// 		c2 = v;
// 	}
// }
// console.timeEnd("structuredClone");
// console.log("structuredClone result:", obj2 === c2);

// 简化测试用例，先验证基本功能
const simpleObj = { map: new Map([["key", "value"]]) };
console.log("Original map:", simpleObj.map);

// 测试 deepCloneIterative
const cloned1 = deepCloneIterative(simpleObj);
console.log("deepCloneIterative result:", cloned1);
console.log("deepCloneIterative map:", cloned1.map);

// 测试 structuredClone
const cloned2 = structuredClonePolyfill(simpleObj);
console.log("structuredClone result:", cloned2);
console.log("structuredClone map:", cloned2.map);

// 如果基本测试通过，再进行性能测试
if (cloned1.map && cloned2.map) {
	const obj = {
		nested: { deeply: { nested: { value: "test" } } },
		array: [1, 2, [3, 4, [5, 6]]],
		date: new Date(),
		regex: /test/gi,
		map: new Map([["key", "value"]]),
		set: new Set([1, 2, 3]),
	};

	console.time("deepCloneIterative");
	const w = iw(obj, deepCloneIterative);
	let c;
	for (let i = 0; i < 10000; i++) {
		const v = w.also((it) => {
			it.map.set("key", "value2");
		});
		if (i === 9999) {
			c = v;
		}
	}
	console.timeEnd("deepCloneIterative");
	console.log("deepCloneIterative result:", obj === c);

	const obj2 = {
		nested: { deeply: { nested: { value: "test" } } },
		array: [1, 2, [3, 4, [5, 6]]],
		date: new Date(),
		regex: /test/gi,
		map: new Map([["key", "value"]]),
		set: new Set([1, 2, 3]),
	};
	console.time("structuredClone");
	const w2 = iw(obj2);
	let c2;
	for (let i = 0; i < 10000; i++) {
		const v = w2.also((it) => {
			it.map.set("key", "value2");
		});
		if (i === 9999) {
			c2 = v;
		}
	}
	console.timeEnd("structuredClone");
	console.log("structuredClone result:", obj2 === c2);
} else {
	console.error("Clone function failed to preserve Map objects");
}
