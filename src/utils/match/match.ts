import { MiniLRUCache } from "../cache/miniLRUCache";
import { Either, Left, Right } from "../either";
import { is } from "./is";
type AsyncOrSync<T> = T | Promise<T>;
type MatchHandler<T, R> = (val: T) => AsyncOrSync<R>;
type MatchHandOrValue<T, R> = MatchHandler<T, R> | R;
type Condition<T> = (val: unknown) => val is T;

type Callback<Output> = (value: Output, index: number) => void;
const NOOP = () => {};
const valueToFunc = <R, T>(v: MatchHandOrValue<R, T>): MatchHandler<R, T> => {
	return (typeof v === "function" ? v : () => v) as MatchHandler<R, T>;
};

interface MatcherManager<Input, Output> {
	cases: Map<Condition<any>, MatchHandler<any, Output>>;
	fallbackHandler: MatchHandler<Input, Output> | null;
	with<T = Input>(
		cond: Condition<T>,
		handler: MatchHandOrValue<T, Output>,
	): MatcherManager<Input, Output>;
	with2(
		to: ((v: Input) => boolean) | Input,
		handler: MatchHandOrValue<Input, Output>,
	): MatcherManager<Input, Output>;
	otherwise(
		handler: MatchHandOrValue<Input, Output>,
	): MatcherManager<Input, Output>;
	run: (value: Input) => Promise<Output>;
	forEach: (
		list: Input[],
		concurrency?: number,
		callback?: Callback<Output>,
	) => Promise<Output[]>;
}

interface MatcherManagerSync<Input, Output> {
	cases: Map<Condition<any>, MatchHandler<any, Output>>;
	fallbackHandler: MatchHandler<Input, Output> | null;
	with<T = Input>(
		cond: Condition<T>,
		handler: MatchHandOrValue<T, Output>,
	): MatcherManagerSync<Input, Output>;
	with2(
		to: ((v: Input) => boolean) | Input,
		handler: MatchHandOrValue<Input, Output>,
	): MatcherManagerSync<Input, Output>;
	otherwise(
		handler: MatchHandOrValue<Input, Output>,
	): MatcherManagerSync<Input, Output>;
	unwrap: (value: Input) => Either<null, Right<Output> | Right<undefined>>;
	run: {
		(value: Input): Either<Error, Output>;
		(value: Input, noError: false): Either<Error, Output>;
		(
			value: Input,
			noError: true,
		): {
			value?: Output;
		};
	};
	forEach: (
		list: Input[],
		callback?: Callback<Output>,
	) => Either<Error, Output[]>;
}

interface MatcherManagerSyncNoEither<Input, Output> {
	cases: Map<Condition<any>, MatchHandler<any, Output>>;
	fallbackHandler: MatchHandler<Input, Output> | null;
	with<T = Input>(
		cond: Condition<T>,
		handler: MatchHandOrValue<T, Output>,
	): MatcherManagerSyncNoEither<Input, Output>;
	with2(
		to: ((v: Input) => boolean) | Input,
		handler: MatchHandOrValue<Input, Output>,
	): MatcherManagerSyncNoEither<Input, Output>;
	otherwise(
		handler: MatchHandOrValue<Input, Output>,
	): MatcherManagerSyncNoEither<Input, Output>;
	unwrapOr: (value: Input, orValue: Output) => Output;
	run: {
		(value: Input): Output | null;
	};
	forEach: (list: Input[], callback?: Callback<Output>) => Output[] | null;
}

function createMatcherManager<Input, Output>(): MatcherManager<Input, Output> {
	const cases = new Map<Condition<any>, MatchHandler<any, Output>>();
	let fallbackHandler: MatchHandler<Input, Output> | null = null;

	let compiledChecks: Condition<any>[] = [];
	let compiledHandlers: MatchHandler<any, Output>[] = [];

	const compile = () => {
		compiledChecks = [];
		compiledHandlers = [];
		for (const [check, handler] of cases) {
			compiledChecks.push(check);
			compiledHandlers.push(handler);
		}
	};

	const runner = async (value: Input): Promise<Output> => {
		const checks = compiledChecks;
		const handlers = compiledHandlers;
		const len = checks.length;
		for (let j = 0; j < len; j++) {
			if (checks[j](value)) return handlers[j](value);
		}
		if (fallbackHandler) return fallbackHandler(value);
		throw new Error("No match found");
	};

	const forEach = async (
		list: Input[],
		concurrency = navigator?.hardwareConcurrency || 8,
		callback: Callback<Output> = NOOP,
	): Promise<Output[]> => {
		const length = list.length;
		const results = new Array<Output>(length);
		let idx = 0;
		let error: unknown = null;

		const checks = compiledChecks;
		const handlers = compiledHandlers;
		const cLen = checks.length;
		const fallback = fallbackHandler;

		const runOne = async (value: Input): Promise<Output> => {
			for (let j = 0; j < cLen; j++) {
				if (checks[j](value)) return handlers[j](value);
			}
			if (fallback) return fallback(value);
			throw new Error("No match found");
		};

		const worker = async () => {
			while (idx < length && !error) {
				const i = idx++;
				try {
					const result = await runOne(list[i]);
					results[i] = result;
					callback(result, i);
				} catch (err) {
					error = err;
				}
			}
		};

		const workers = new Array(Math.min(concurrency, length));
		for (let i = 0; i < workers.length; i++) workers[i] = worker();
		await Promise.all(workers);

		if (error) throw error;
		return results;
	};

	const api: MatcherManager<Input, Output> = {
		cases,
		fallbackHandler,
		with<T>(cond: Condition<T>, handler: MatchHandOrValue<T, Output>) {
			cases.set(cond, valueToFunc<T, Output>(handler));
			compile();
			return api;
		},
		with2(
			to: ((v: Input) => boolean) | Input,
			handler: MatchHandOrValue<Input, Output>,
		) {
			const t =
				typeof to === "function"
					? (to as (v: Input) => boolean)
					: (v: Input) => v === to;
			const is2 = is.to(t);
			cases.set(is2, valueToFunc<Input, Output>(handler));
			compile();
			return api;
		},
		otherwise(handler: MatchHandOrValue<Input, Output>) {
			fallbackHandler = valueToFunc<Input, Output>(handler);
			return api;
		},
		run: runner,
		forEach,
	};

	return api;
}

function createMatcherManagerSync<Input, Output>(): MatcherManagerSync<
	Input,
	Output
> {
	const cases = new Map<Condition<any>, MatchHandler<any, Output>>();
	let fallbackHandler: MatchHandler<Input, Output> | null = null;

	// 预编译为数组，避免热循环中 Map 迭代器的开销
	let compiledChecks: Condition<any>[] = [];
	let compiledHandlers: MatchHandler<any, Output>[] = [];

	const compile = () => {
		compiledChecks = [];
		compiledHandlers = [];
		for (const [check, handler] of cases) {
			compiledChecks.push(check);
			compiledHandlers.push(handler);
		}
	};

	const runner = (
		value: Input,
		noError: boolean = false,
	):
		| Either<Error, Output>
		| {
				value?: Output;
		  } => {
		const checks = compiledChecks;
		const handlers = compiledHandlers;
		const len = checks.length;
		for (let j = 0; j < len; j++) {
			if (checks[j](value))
				return noError
					? ({ value: handlers[j](value) as Output } as { value?: Output })
					: (new Right(handlers[j](value)) as Right<Output>);
		}
		if (fallbackHandler) {
			return noError
				? ({ value: fallbackHandler(value) as Output } as { value?: Output })
				: (new Right(fallbackHandler(value)) as Right<Output>);
		}
		if (!noError) {
			return new Left(new Error("No match found"));
		} else {
			return { value: undefined };
		}
	};

	const forEach = (
		list: Input[],
		callback: Callback<Output> = NOOP,
	): Either<Error, Output[]> => {
		const checks = compiledChecks;
		const handlers = compiledHandlers;
		const cLen = checks.length;
		const len = list.length;
		const results = new Array<Output>(len);
		const fallback = fallbackHandler;

		for (let i = 0; i < len; i++) {
			const val = list[i];
			let matched = false;

			for (let j = 0; j < cLen; j++) {
				if (checks[j](val)) {
					const result = handlers[j](val);
					results[i] = result as Output;
					callback(result as Output, i);
					matched = true;
					break;
				}
			}

			if (!matched) {
				if (fallback) {
					const result = fallback(val);
					results[i] = result as Output;
					callback(result as Output, i);
				} else {
					return new Left(new Error(`No match found at index ${i}`));
				}
			}
		}

		return new Right(results);
	};

	const api: MatcherManagerSync<Input, Output> = {
		cases,
		fallbackHandler,
		with<T>(cond: Condition<T>, handler: MatchHandOrValue<T, Output>) {
			cases.set(cond, valueToFunc<T, Output>(handler));
			compile();
			return api;
		},
		with2(
			to: ((v: Input) => boolean) | Input,
			handler: MatchHandOrValue<Input, Output>,
		) {
			const t =
				typeof to === "function"
					? (to as (v: Input) => boolean)
					: (v: Input) => v === to;
			const is2 = is.to(t);
			cases.set(is2, valueToFunc<Input, Output>(handler));
			compile();
			return api;
		},
		otherwise(handler: MatchHandOrValue<Input, Output>) {
			fallbackHandler = valueToFunc<Input, Output>(handler);
			return api;
		},
		unwrap: (value: Input): Either<null, Right<Output> | Right<undefined>> => {
			const checks = compiledChecks;
			const handlers = compiledHandlers;
			const len = checks.length;
			for (let j = 0; j < len; j++) {
				if (checks[j](value))
					return new Right(handlers[j](value) as Output) as Either<
						null,
						Right<Output>
					>;
			}
			if (fallbackHandler)
				return new Right(fallbackHandler(value) as Output) as Either<
					null,
					Right<Output>
				>;
			return new Right(undefined) as unknown as Either<null, Right<undefined>>;
		},
		run: runner as {
			(value: Input): Either<Error, Output>;
			(value: Input, noError: false): Either<Error, Output>;
			(
				value: Input,
				noError: true,
			): {
				value?: Output;
			};
		},
		forEach,
	};

	return api;
}

function createMatcherManagerSyncNoEither<
	Input,
	Output,
>(): MatcherManagerSyncNoEither<Input, Output> {
	const cases = new Map<Condition<any>, MatchHandler<any, Output>>();
	let fallbackHandler: MatchHandler<Input, Output> | null = null;

	// 预编译为数组，避免热循环中 Map 迭代器的开销
	let compiledChecks: Condition<any>[] = [];
	let compiledHandlers: MatchHandler<any, Output>[] = [];

	const compile = () => {
		compiledChecks = [];
		compiledHandlers = [];
		for (const [check, handler] of cases) {
			compiledChecks.push(check);
			compiledHandlers.push(handler);
		}
	};

	const runner = (value: Input): Output | null => {
		const checks = compiledChecks;
		const handlers = compiledHandlers;
		const len = checks.length;
		for (let j = 0; j < len; j++) {
			if (checks[j](value)) return handlers[j](value) as Output | null;
		}
		if (fallbackHandler) {
			return fallbackHandler(value) as Output | null;
		}
		return null;
	};

	const forEach = (
		list: Input[],
		callback: Callback<Output> = NOOP,
	): Output[] | null => {
		const checks = compiledChecks;
		const handlers = compiledHandlers;
		const cLen = checks.length;
		const len = list.length;
		const results = new Array<Output>(len);
		const fallback = fallbackHandler;

		for (let i = 0; i < len; i++) {
			const val = list[i];
			let matched = false;

			for (let j = 0; j < cLen; j++) {
				if (checks[j](val)) {
					const result = handlers[j](val);
					results[i] = result as Output;
					callback(result as Output, i);
					matched = true;
					break;
				}
			}

			if (!matched) {
				if (fallback) {
					const result = fallback(val);
					results[i] = result as Output;
					callback(result as Output, i);
				} else {
					return null;
				}
			}
		}

		return results;
	};

	const api: MatcherManagerSyncNoEither<Input, Output> = {
		cases,
		fallbackHandler,
		with<T>(cond: Condition<T>, handler: MatchHandOrValue<T, Output>) {
			cases.set(cond, valueToFunc<T, Output>(handler));
			compile();
			return api;
		},
		with2(
			to: ((v: Input) => boolean) | Input,
			handler: MatchHandOrValue<Input, Output>,
		) {
			const t =
				typeof to === "function"
					? (to as (v: Input) => boolean)
					: (v: Input) => v === to;
			const is2 = is.to(t);
			cases.set(is2, valueToFunc<Input, Output>(handler));
			compile();
			return api;
		},
		otherwise(handler: MatchHandOrValue<Input, Output>) {
			fallbackHandler = valueToFunc<Input, Output>(handler);
			return api;
		},
		unwrapOr: (input, orValue) => {
			const result = runner(input);
			return result !== null ? result : orValue;
		},
		run: runner,
		forEach,
	};

	return api;
}

export function match<Input, Output>(): MatcherManager<Input, Output> {
	const manager = createMatcherManager<Input, Output>();
	return manager;
}

export function matchSync<Input, Output>(): MatcherManagerSync<Input, Output> {
	const manager = createMatcherManagerSync<Input, Output>();
	return manager;
}

export function matchSyncNoEither<Input, Output>(): MatcherManagerSyncNoEither<
	Input,
	Output
> {
	const manager = createMatcherManagerSyncNoEither<Input, Output>();
	return manager;
}

type LRUOptions =
	| {
			useLRU: true;
			maxSize: number;
			maxAge: number;
			autoSweep?: boolean;
			sweepInterval?: number;
	  }
	| {
			useLRU: false;
			maxSize?: number;
			maxAge?: number;
	  };

type MatcherSyncBuilder<A, B> = (
	self: (value: A) => B,
	matcher: MatcherManagerSync<A, B>,
) => MatcherManagerSync<A, B>;
export type MatcherBuilder<A, B> = (
	self: (value: A) => Promise<B>,
	matcher: MatcherManager<A, B>,
) => MatcherManager<A, B>;
type MatcherSyncBuilderNoEither<A, B> = (
	self: (value: A) => B,
	matcher: MatcherManagerSyncNoEither<A, B>,
) => MatcherManagerSyncNoEither<A, B>;
/**
 * This function is suitable for the fib function will be similar to the iterative evaluation of the value of the scenario,
 * the use of caching can be avoided to repeat the calculation.
 * @template Input , Output
 * @param builder
 * @param options
 * @returns
 * @example
 * //
 * // Of course, we recommend other algorithms,
 * // such as the Matrix Fast Power Algorithm,
 * // for purely tangent-linear computations.
 * //
 * const fibSyncMemo = matchSyncMemo<bigint, bigint>(
 *		(self, m) =>
 *			m
 *				.with2((n) => n <= 1n || n === 2n, 1n)
 *				.otherwise((n) => self(n - 1n) + self(n - 2n)),
 *		{
 *			useLRU: true,
 *			maxSize: 50,
 *			maxAge: 3000,
 *		}
 *	);
 */
export function matchSyncNoEitherMemo<Input, Output>(
	builder: MatcherSyncBuilderNoEither<Input, Output>,
	options: LRUOptions = { useLRU: false, maxSize: 1000, maxAge: 1000 * 60 * 5 },
): (value: Input) => Output | null {
	let fn!: (value: Input) => Output;

	// Pre-construct matcher to avoid rebuilding on each call
	const matcher = builder(
		(v: Input) => fn(v),
		matchSyncNoEither<Input, Output>(),
	);

	const cache = options.useLRU
		? new MiniLRUCache<Input, Output>(options.maxSize!, {
				ttl: options.maxAge ?? 0,
			})
		: new Map<Input, Output>();
	const weakCache = new WeakMap<object, Output>();

	fn = (value: Input): Output => {
		const isObject = typeof value === "object" && value !== null;

		// 1) Check cache
		if (isObject) {
			const cached = weakCache.get(value as object);
			if (cached !== undefined) return cached;
		} else {
			const cached = cache.get(value);
			if (cached !== undefined) return cached;
		}

		// 2) Run matcher only once
		const result = matcher.run(value);

		// 3) Handle error or extract result
		if (result === null) return null as unknown as Output;

		// 4) Cache result
		if (isObject) {
			weakCache.set(value as object, result);
		} else {
			cache.set(value, result);
		}

		return result;
	};

	return fn;
}
export function matchSyncMemo<Input, Output>(
	builder: MatcherSyncBuilder<Input, Output>,
	options: LRUOptions = { useLRU: false, maxSize: 1000, maxAge: 1000 * 60 * 5 },
): (value: Input) => Output {
	let fn!: (value: Input) => Output;

	// Pre-construct matcher to avoid rebuilding on each call
	const matcher = builder((v: Input) => fn(v), matchSync<Input, Output>());

	const cache = options.useLRU
		? new MiniLRUCache<Input, Output>(options.maxSize!, {
				ttl: options.maxAge ?? 0,
			})
		: new Map<Input, Output>();
	const weakCache = new WeakMap<object, Output>();

	fn = (value: Input): Output => {
		const isObject = typeof value === "object" && value !== null;

		// 1) Check cache
		if (isObject) {
			const cached = weakCache.get(value as object);
			if (cached !== undefined) return cached;
		} else {
			const cached = cache.get(value);
			if (cached !== undefined) return cached;
		}

		// 2) Run matcher only once
		const result = matcher.run(value);

		// 3) Handle error or extract result
		if (result.isLeft()) throw result.value;
		const output = (result as Right<Output>).value;
		// 4) Cache result
		if (isObject) {
			weakCache.set(value as object, output);
		} else {
			cache.set(value, output);
		}

		return output;
	};

	return fn;
}
/**
 * Add memoization to async match (concurrency-friendly version)
 * @template Input, Output
 * @param builder A constructor function that takes (self, matcher) => matcher, where self is used for recursive calls
 * @param options Caching strategy. When useLRU is true, uses MiniLRUCache; otherwise uses Map
 * @returns A function of type (value: Input) => Promise<Output> with built-in concurrent deduplication and caching
 */
export function matchAsyncMemo<Input, Output>(
	builder: MatcherBuilder<Input, Output>,
	options: LRUOptions = { useLRU: false, maxSize: 1000, maxAge: 1000 * 60 * 5 },
): (value: Input) => Promise<Output> {
	// 先声明 fn，让 builder 能够在内部递归调用
	let fn!: (value: Input) => Promise<Output>;

	// 构造一个异步 matcher（基于 match()）
	const matcher = builder((v: Input) => fn(v), match<Input, Output>());

	// 根据选项来决定缓存容器
	// 如果 useLRU = true，则直接用 Map<Input, Promise<Output>>
	// 否则用 MiniLRUCache<Input, Promise<Output>>，并指定 ttl 为 maxAge
	const cache = options.useLRU
		? new MiniLRUCache<Input, Promise<Output>>(options.maxSize!, {
				ttl: options.maxAge ?? 0,
			})
		: new Map<Input, Promise<Output>>();

	// 对象类型单独缓存到弱引用中，自动在对象不可达时被回收
	const weakCache = new WeakMap<object, Promise<Output>>();

	fn = async (value: Input): Promise<Output> => {
		const isObject = typeof value === "object" && value !== null;
		// 先看缓存里有没有“正在进行”或已经完成的 Promise
		if (isObject) {
			const existing = weakCache.get(value as object);
			if (existing) {
				return existing;
			}
		} else {
			const existing = options.useLRU
				? (cache as MiniLRUCache<Input, Promise<Output>>).get(value)
				: (cache as Map<Input, Promise<Output>>).get(value);
			if (existing) {
				return existing;
			}
		}

		// 如果没有，就新建一个 Promise，放入缓存，然后执行 matcher.run
		const rawPromise = (async () => {
			// 如果 matcher.run 抛错，则会走到 catch；注意不要漏掉上层的 reject
			const result = await matcher.run(value);
			return result;
		})();

		// 为了并发安全：包一层 catch，出错时把缓存清理掉
		const wrappedPromise = rawPromise.catch((err) => {
			// 清理对应的缓存项
			if (isObject) {
				weakCache.delete(value as object);
			} else {
				if (options.useLRU) {
					(cache as MiniLRUCache<Input, Promise<Output>>).remove(value);
				} else {
					(cache as Map<Input, Promise<Output>>).delete(value);
				}
			}
			// 然后把错误继续往外抛
			return Promise.reject(err);
		});

		// 放入缓存
		if (isObject) {
			weakCache.set(value as object, wrappedPromise);
		} else {
			if (options.useLRU) {
				(cache as MiniLRUCache<Input, Promise<Output>>).set(
					value,
					wrappedPromise,
				);
			} else {
				(cache as Map<Input, Promise<Output>>).set(value, wrappedPromise);
			}
		}

		// 最终返回这个 Promise
		return wrappedPromise;
	};

	return fn;
}

export {
	createMatcherManager,
	createMatcherManagerSync,
	createMatcherManagerSyncNoEither,
};
