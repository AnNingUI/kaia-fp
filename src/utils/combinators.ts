/** Returns the value passed to it. */
export function identity<A>(a: A): A {
	return a;
}

/** Returns a function that always returns the given value. */
export function constant<A>(a: A): () => A {
	return () => a;
}

/** Returns a function that negates the result of the given predicate. */
export function complement<A extends any[]>(
	fn: (...args: A) => boolean,
): (...args: A) => boolean {
	return (...args) => !fn(...args);
}

/** Left-to-right function composition. Unlike `pipe`, each step can change the type. */
export function flow<A, B>(ab: (a: A) => B): (a: A) => B;
export function flow<A, B, C>(ab: (a: A) => B, bc: (b: B) => C): (a: A) => C;
export function flow<A, B, C, D>(
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
): (a: A) => D;
export function flow<A, B, C, D, E>(
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
): (a: A) => E;
export function flow<A, B, C, D, E, F>(
	ab: (a: A) => B,
	bc: (b: B) => C,
	cd: (c: C) => D,
	de: (d: D) => E,
	ef: (e: E) => F,
): (a: A) => F;
export function flow(...fns: Function[]) {
	return (input: any) => fns.reduce((acc, fn) => fn(acc), input);
}

/** Runs a side-effect function on the value, then returns the original value unchanged. */
export function tap<A>(f: (a: A) => void): (a: A) => A {
	return (a) => {
		f(a);
		return a;
	};
}

/** Ensures a function is called only once. Subsequent calls return the cached result. */
export function once<A extends any[], R>(fn: (...args: A) => R): (...args: A) => R {
	let called = false;
	let result: R;
	return (...args) => {
		if (!called) {
			called = true;
			result = fn(...args);
		}
		return result;
	};
}

/** Restricts a number to be within [min, max]. */
export function clamp(min: number, max: number, value: number): number;
/** curried 版本：clamp(0, 100) 返回 (n) => clamped，可直接用于 pipe */
export function clamp(min: number, max: number): (value: number) => number;
export function clamp(min: number, max: number, value?: number): any {
	if (value !== undefined) return value < min ? min : value > max ? max : value;
	return (v: number) => v < min ? min : v > max ? max : v;
}

/** Returns true if value is within [min, max]. */
export function between(min: number, max: number, value: number): boolean;
/** curried 版本：between(0, 100) 返回 (n) => boolean，可直接用于 pipe */
export function between(min: number, max: number): (value: number) => boolean;
export function between(min: number, max: number, value?: number): any {
	if (value !== undefined) return value >= min && value <= max;
	return (v: number) => v >= min && v <= max;
}

/** Returns a function that extracts a property from an object. */
export function prop<K extends string>(key: K): <T extends Record<K, any>>(obj: T) => T[K] {
	return (obj) => obj[key];
}

/** Returns a new object with only the specified keys. */
export function pick<T extends object>(obj: T): T;
export function pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;
/** curried 版本：pick("name", "age") 返回 (obj) => picked，可直接用于 pipe */
export function pick<K extends string>(...keys: K[]): <T extends Record<K, any>>(obj: T) => Pick<T, K>;
export function pick(...args: any[]): any {
	if (args.length >= 1 && typeof args[0] === "string") {
		const keys = args as string[];
		return (obj: any) => {
			const result = {} as any;
			for (const key of keys) {
				if (key in obj) result[key] = obj[key];
			}
			return result;
		};
	}
	const [obj, ...keys] = args;
	const result = {} as any;
	for (const key of keys) {
		if (key in obj) result[key] = obj[key];
	}
	return result;
}

/** Returns a new object without the specified keys. */
export function omit<T extends object>(obj: T): T;
export function omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K>;
/** curried 版本：omit("password") 返回 (obj) => omitted，可直接用于 pipe */
export function omit<K extends string>(...keys: K[]): <T extends Record<K, any>>(obj: T) => Omit<T, K>;
export function omit(...args: any[]): any {
	if (args.length >= 1 && typeof args[0] === "string") {
		const keys = args as string[];
		return (obj: any) => {
			const result = { ...obj };
			for (const key of keys) {
				delete result[key];
			}
			return result;
		};
	}
	const [obj, ...keys] = args;
	const result = { ...obj };
	for (const key of keys) {
		delete result[key];
	}
	return result;
}

export interface MemoizeCache<K, V> {
	get(key: K): V | undefined;
	set(key: K, value: V): void;
	has(key: K): boolean;
}

/**
 * Memoizes a function using a Map by default, or a custom cache implementation.
 *
 * For object keys, a WeakMap is used internally to avoid memory leaks.
 * Primitive keys use the provided cache (default: Map).
 */
export function memoize<Args extends any[], R>(
	fn: (...args: Args) => R,
	options?: {
		keyFn?: (...args: Args) => unknown;
		cache?: MemoizeCache<unknown, R>;
	},
): (...args: Args) => R {
	const keyFn = options?.keyFn ?? ((...args) => (args.length === 1 ? args[0] : JSON.stringify(args)));
	const primitiveCache: MemoizeCache<unknown, R> = options?.cache ?? new Map();
	const weakCache = new WeakMap<object, R>();

	return (...args: Args): R => {
		const key = keyFn(...args);

		if (typeof key === "object" && key !== null) {
			const cached = weakCache.get(key as object);
			if (cached !== undefined) return cached;
			const result = fn(...args);
			weakCache.set(key as object, result);
			return result;
		}

		const cached = primitiveCache.get(key);
		if (cached !== undefined) return cached;
		const result = fn(...args);
		primitiveCache.set(key, result);
		return result;
	};
}
