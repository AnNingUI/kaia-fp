export interface StructuredCloneOptions {
	transfer?: ReadonlyArray<Transferable>;
}

export type StructuredCloneFn = <T>(
	value: T,
	options?: StructuredCloneOptions,
) => T;

let clonedFn: StructuredCloneFn | null = null;

export function getStructuredClone(): StructuredCloneFn {
	// 如果已经初始化，直接返回
	if (clonedFn !== null) {
		return clonedFn;
	}

	// 使用原生 structuredClone API（如果支持）
	if (typeof structuredClone === "function") {
		clonedFn = structuredClone as StructuredCloneFn;
		return clonedFn;
	}

	// 使用同步的深拷贝方法作为回退
	clonedFn = (obj: any, options?: StructuredCloneOptions) => {
		try {
			return deepCloneIterative(obj); // 调用你实现的同步深拷贝
		} catch (error) {
			console.error("Deep clone failed:", error);
			throw error;
		}
	};

	return clonedFn;
}

// 辅助函数：获取正则表达式的标志位
function getRegExpFlags(regExp: RegExp): string {
	const flags: string[] = [];
	if (regExp.global) flags.push("g");
	if (regExp.ignoreCase) flags.push("i");
	if (regExp.multiline) flags.push("m");
	if ((regExp as any).sticky) flags.push("y");
	if ((regExp as any).unicode) flags.push("u");
	return flags.join("");
}

export function deepCloneIterative<T>(value: T): T {
	const visited = new WeakMap();

	function clone(item: any): any {
		if (item === null || typeof item !== "object") {
			return item;
		}

		if (visited.has(item)) {
			return visited.get(item);
		}

		let copy: any;

		if (item instanceof Date) {
			copy = new Date(item.getTime());
		} else if (item instanceof RegExp) {
			const flags = item.flags || getRegExpFlags(item);
			copy = new RegExp(item.source, flags);
		} else if (Array.isArray(item)) {
			copy = new Array(item.length);
			visited.set(item, copy);
			for (let i = 0; i < item.length; i++) {
				copy[i] = clone(item[i]);
			}
			return copy;
		} else if (item instanceof Set) {
			copy = new Set();
			visited.set(item, copy);
			for (const value of item) {
				copy.add(clone(value));
			}
			return copy;
		} else if (item instanceof Map) {
			copy = new Map();
			visited.set(item, copy);
			for (const [key, value] of item) {
				copy.set(clone(key), clone(value));
			}
			return copy;
		} else if (ArrayBuffer.isView(item)) {
			const buffer = item.buffer.slice(0);
			const Ctor = (item as any).constructor;
			return new Ctor(
				buffer,
				item.byteOffset,
				item.byteLength / Ctor.BYTES_PER_ELEMENT,
			);
		} else {
			copy = Object.create(Object.getPrototypeOf(item));
			visited.set(item, copy);

			const descriptors = Object.getOwnPropertyDescriptors(item);
			for (const [key, descriptor] of Object.entries(descriptors)) {
				if (descriptor.value !== undefined) {
					descriptor.value = clone(descriptor.value);
				}
				Object.defineProperty(copy, key, descriptor);
			}
			return copy;
		}
	}

	return clone(value);
}

export const structuredClonePolyfill: StructuredCloneFn = getStructuredClone();

// 高性能深拷贝实现
// function deepClone<T>(value: T, visited = new WeakMap()): T {
// 	const type = typeof value;

// 	// 快速路径：原始类型直接返回
// 	if (value === null || type !== "object") {
// 		return value;
// 	}

// 	// 使用constructor.name进行快速类型检查（比instanceof更快）
// 	const constructor = (value as any)?.constructor;
// 	const tag = constructor?.name || "Object";

// 	// 处理循环引用
// 	if (visited.has(value as any)) {
// 		return visited.get(value as any) as T;
// 	}

// 	switch (tag) {
// 		case "Date":
// 			return new Date((value as Date).getTime()) as T;

// 		case "RegExp":
// 			const regExp = value as RegExp;
// 			const flags = regExp.flags || getRegExpFlags(regExp);
// 			return new RegExp(regExp.source, flags) as T;

// 		case "Array":
// 			const arr = value as any[];
// 			const arrCopy = new Array(arr.length);
// 			visited.set(value as any, arrCopy);

// 			// 使用while循环比for循环更快
// 			let i = 0;
// 			while (i < arr.length) {
// 				arrCopy[i] = deepClone(arr[i], visited);
// 				i++;
// 			}
// 			return arrCopy as T;

// 		case "Set":
// 			const set = value as Set<any>;
// 			const setCopy = new Set();
// 			visited.set(value as any, setCopy);

// 			// 预分配数组大小并批量处理
// 			const setItems = Array.from(set);
// 			let j = 0;
// 			while (j < setItems.length) {
// 				setCopy.add(deepClone(setItems[j], visited));
// 				j++;
// 			}
// 			return setCopy as T;

// 		case "Map":
// 			const map = value as Map<any, any>;
// 			const mapCopy = new Map();
// 			visited.set(value as any, mapCopy);

// 			// 批量处理键值对
// 			const mapEntries = Array.from(map);
// 			let k = 0;
// 			while (k < mapEntries.length) {
// 				const [key, val] = mapEntries[k];
// 				mapCopy.set(deepClone(key, visited), deepClone(val, visited));
// 				k++;
// 			}
// 			return mapCopy as T;

// 		default:
// 			// 处理Set和Map，因为constructor.name可能不可靠
// 			if (value instanceof Set) {
// 				const set = value as Set<any>;
// 				const setCopy = new Set();
// 				visited.set(value as any, setCopy);

// 				// 预分配数组大小并批量处理
// 				const setItems = Array.from(set);
// 				let j = 0;
// 				while (j < setItems.length) {
// 					setCopy.add(deepClone(setItems[j], visited));
// 					j++;
// 				}
// 				return setCopy as T;
// 			}

// 			if (value instanceof Map) {
// 				const map = value as Map<any, any>;
// 				const mapCopy = new Map();
// 				visited.set(value as any, mapCopy);

// 				// 批量处理键值对
// 				const mapEntries = Array.from(map);
// 				let k = 0;
// 				while (k < mapEntries.length) {
// 					const [key, val] = mapEntries[k];
// 					mapCopy.set(deepClone(key, visited), deepClone(val, visited));
// 					k++;
// 				}
// 				return mapCopy as T;
// 			}

// 			// 处理TypedArray和其他内置类型
// 			if (ArrayBuffer.isView(value)) {
// 				const typedArray = value as any;
// 				const buffer = typedArray.buffer.slice(0);
// 				const Ctor = typedArray.constructor as any;
// 				return new Ctor(
// 					buffer,
// 					typedArray.byteOffset,
// 					typedArray.byteLength / Ctor.BYTES_PER_ELEMENT
// 				) as T;
// 			}

// 			// 普通对象
// 			const objCopy = Object.create(constructor?.prototype || null);
// 			visited.set(value as any, objCopy);

// 			// 使用Object.getOwnPropertyDescriptors获取所有属性（包括不可枚举的）
// 			const descriptors = Object.getOwnPropertyDescriptors(value);
// 			const keys = Object.keys(descriptors);

// 			let l = 0;
// 			while (l < keys.length) {
// 				const key = keys[l];
// 				const descriptor = descriptors[key];

// 				if (descriptor.value !== undefined) {
// 					descriptor.value = deepClone(descriptor.value, visited);
// 				}

// 				Object.defineProperty(objCopy, key, descriptor);
// 				l++;
// 			}

// 			return objCopy as T;
// 	}
// }
