import { Options, Some, None } from "../instances/option";
import { Either, Left, Right } from "./either";

/** Map each element with f, then collect all Some results into one Option. If any is None, the result is None. */
export function traverseOption<A, B>(
	arr: A[],
	f: (a: A, i: number) => Options<B>
): Options<B[]> {
	const result: B[] = [];
	for (let i = 0; i < arr.length; i++) {
		const ob = f(arr[i], i);
		if (ob.isNone()) return None.of() as Options<B[]>;
		result.push(ob.value!);
	}
	return new Some(result);
}

/** Collect an array of Options into an Option of array. If any is None, the result is None. */
export function sequenceOption<A>(arr: Options<A>[]): Options<A[]> {
	return traverseOption(arr, (oa) => oa);
}

/** Map each element with f, then collect all Right results into one Either. If any is Left, returns the first Left. */
export function traverseEither<E, A, B>(
	arr: A[],
	f: (a: A, i: number) => Either<E, B>
): Either<E, B[]> {
	const result: B[] = [];
	for (let i = 0; i < arr.length; i++) {
		const eb = f(arr[i], i);
		if (eb.isLeft()) return eb as Left<E>;
		result.push(eb.value as B);
	}
	return new Right(result);
}

/** Collect an array of Eithers into an Either of array. If any is Left, returns the first Left. */
export function sequenceEither<E, A>(arr: Either<E, A>[]): Either<E, A[]> {
	return traverseEither(arr, (ea) => ea);
}

/** Group array elements by a key derived from a function. */
export function groupBy<A, K extends string | number>(
	arr: A[],
	keyFn: (a: A) => K
): Record<K, A[]>;
/** curried 版本：groupBy(keyFn) 返回 (arr) => grouped，可直接用于 pipe */
export function groupBy<A, K extends string | number>(
	keyFn: (a: A) => K
): (arr: A[]) => Record<K, A[]>;
export function groupBy(...args: any[]): any {
	if (args.length === 1) {
		const keyFn = args[0];
		return (arr: any[]) => {
			const result = {} as any;
			for (const item of arr) {
				const key = keyFn(item);
				(result[key] ??= []).push(item);
			}
			return result;
		};
	}
	const [arr, keyFn] = args;
	const result = {} as any;
	for (const item of arr) {
		const key = keyFn(item);
		(result[key] ??= []).push(item);
	}
	return result;
}

/** Split an array into two groups based on a predicate. */
export function partition<A>(
	arr: A[],
	predicate: (a: A) => boolean
): [truthy: A[], falsy: A[]];
/** curried 版本：partition(predicate) 返回 (arr) => [truthy, falsy]，可直接用于 pipe */
export function partition<A>(
	predicate: (a: A) => boolean
): (arr: A[]) => [truthy: A[], falsy: A[]];
export function partition(...args: any[]): any {
	if (args.length === 1) {
		const predicate = args[0];
		return (arr: any[]) => {
			const truthy: any[] = [];
			const falsy: any[] = [];
			for (const item of arr) {
				(predicate(item) ? truthy : falsy).push(item);
			}
			return [truthy, falsy];
		};
	}
	const [arr, predicate] = args;
	const truthy: any[] = [];
	const falsy: any[] = [];
	for (const item of arr) {
		(predicate(item) ? truthy : falsy).push(item);
	}
	return [truthy, falsy];
}

/** Safely get the first element as an Option-like result. */
export function head<A>(arr: readonly A[]): A | undefined {
	return arr.length > 0 ? arr[0] : undefined;
}

/** Safely get the last element. */
export function last<A>(arr: readonly A[]): A | undefined {
	return arr.length > 0 ? arr[arr.length - 1] : undefined;
}

/** Returns all elements except the first. */
export function tail<A>(arr: readonly A[]): A[] {
	return arr.slice(1);
}

/** Returns all elements except the last. */
export function init<A>(arr: readonly A[]): A[] {
	return arr.slice(0, -1);
}

/** Flatten one level of nested arrays. */
export function flatten<A>(arr: readonly (A | readonly A[])[]): A[] {
	return arr.flat() as A[];
}

/** Map then flatten (one level). */
export function flatMapArr<A, B>(arr: readonly A[], f: (a: A, i: number) => B | readonly B[]): B[];
/** curried 版本：flatMapArr(f) 返回 (arr) => flatMapped，可直接用于 pipe */
export function flatMapArr<A, B>(f: (a: A, i: number) => B | readonly B[]): (arr: readonly A[]) => B[];
export function flatMapArr(...args: any[]): any {
	if (args.length === 1) {
		const f = args[0];
		return (arr: readonly any[]) => arr.flatMap(f);
	}
	const [arr, f] = args;
	return arr.flatMap(f);
}

/** Remove duplicates using SameValueZero equality. */
export function uniq<A>(arr: readonly A[]): A[] {
	return [...new Set(arr)];
}

/** Remove duplicates by a derived key. */
export function uniqBy<A, K>(arr: readonly A[], keyFn: (a: A) => K): A[];
/** curried 版本：uniqBy(keyFn) 返回 (arr) => deduped，可直接用于 pipe */
export function uniqBy<A, K>(keyFn: (a: A) => K): (arr: readonly A[]) => A[];
export function uniqBy(...args: any[]): any {
	if (args.length === 1) {
		const keyFn = args[0];
		return (arr: readonly any[]) => {
			const seen = new Set();
			const result: any[] = [];
			for (const item of arr) {
				const key = keyFn(item);
				if (!seen.has(key)) {
					seen.add(key);
					result.push(item);
				}
			}
			return result;
		};
	}
	const [arr, keyFn] = args;
	const seen = new Set();
	const result: any[] = [];
	for (const item of arr) {
		const key = keyFn(item);
		if (!seen.has(key)) {
			seen.add(key);
			result.push(item);
		}
	}
	return result;
}

/** Split an array into chunks of the given size. */
export function chunk<A>(size: number, arr: readonly A[]): A[][];
/** curried 版本：chunk(size) 返回 (arr) => chunked，可直接用于 pipe */
export function chunk(size: number): <A>(arr: readonly A[]) => A[][];
export function chunk(...args: any[]): any {
	if (args.length === 1) {
		const size = args[0];
		return (arr: readonly any[]) => {
			const result: any[][] = [];
			for (let i = 0; i < arr.length; i += size) {
				result.push(arr.slice(i, i + size));
			}
			return result;
		};
	}
	const [size, arr] = args;
	const result: any[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, i + size));
	}
	return result;
}

/** Pair up elements from two arrays. Length is determined by the shorter array. */
export function zip<A, B>(arrA: readonly A[], arrB: readonly B[]): [A, B][] {
	const len = Math.min(arrA.length, arrB.length);
	const result: [A, B][] = new Array(len);
	for (let i = 0; i < len; i++) {
		result[i] = [arrA[i], arrB[i]];
	}
	return result;
}

/** Unzip an array of pairs into a pair of arrays. */
export function unzip<A, B>(arr: readonly [A, B][]): [A[], B[]] {
	const as: A[] = new Array(arr.length);
	const bs: B[] = new Array(arr.length);
	for (let i = 0; i < arr.length; i++) {
		as[i] = arr[i][0];
		bs[i] = arr[i][1];
	}
	return [as, bs];
}

/** Elements in `a` that are not in `b`. */
export function difference<A>(a: readonly A[], b: readonly A[]): A[] {
	const setB = new Set(b);
	return a.filter((x) => !setB.has(x));
}

/** Elements present in both `a` and `b`. */
export function intersection<A>(a: readonly A[], b: readonly A[]): A[] {
	const setB = new Set(b);
	return a.filter((x) => setB.has(x));
}

/** All unique elements from both `a` and `b`. */
export function union<A>(a: readonly A[], b: readonly A[]): A[] {
	return [...new Set([...a, ...b])];
}
