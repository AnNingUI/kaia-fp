export type PipeResult<Fns extends ((...args: any[]) => any)[]> = Fns extends [
	(...args: any[]) => any,
	...any[],
]
	? ((
			arg: Parameters<Fns[0]>[0],
		) => ReturnType<
			Fns extends [...any[], infer Last extends (...args: any[]) => any]
				? Last
				: never
		>) & {
			extends: <NewFns extends ((...args: any[]) => any)[]>(
				...fns: NewFns
			) => PipeResult<[...Fns, ...NewFns]>;
		}
	: ((arg: any) => any) & {
			extends: <NewFns extends ((...args: any[]) => any)[]>(
				...fns: NewFns
			) => PipeResult<NewFns>;
		};

// 中间类型推导需要具体重载（TS 递归类型的固有限制）
export function pipe<A, B>(fn1: (a: A) => B): PipeResult<[(a: A) => B]>;
export function pipe<A, B, C>(
	fn1: (a: A) => B,
	fn2: (b: B) => C,
): PipeResult<[(a: A) => B, (b: B) => C]>;
export function pipe<A, B, C, D>(
	fn1: (a: A) => B,
	fn2: (b: B) => C,
	fn3: (c: C) => D,
): PipeResult<[(a: A) => B, (b: B) => C, (c: C) => D]>;
export function pipe<A, B, C, D, E>(
	fn1: (a: A) => B,
	fn2: (b: B) => C,
	fn3: (c: C) => D,
	fn4: (d: D) => E,
): PipeResult<[(a: A) => B, (b: B) => C, (c: C) => D, (d: D) => E]>;
export function pipe<A, B, C, D, E, F>(
	fn1: (a: A) => B,
	fn2: (b: B) => C,
	fn3: (c: C) => D,
	fn4: (d: D) => E,
	fn5: (e: E) => F,
): PipeResult<
	[(a: A) => B, (b: B) => C, (c: C) => D, (d: D) => E, (e: E) => F]
>;
export function pipe<A, B, C, D, E, F, G>(
	fn1: (a: A) => B,
	fn2: (b: B) => C,
	fn3: (c: C) => D,
	fn4: (d: D) => E,
	fn5: (e: E) => F,
	fn6: (f: F) => G,
): PipeResult<
	[(a: A) => B, (b: B) => C, (c: C) => D, (d: D) => E, (e: E) => F, (f: F) => G]
>;
export function pipe<A, B, C, D, E, F, G, H>(
	fn1: (a: A) => B,
	fn2: (b: B) => C,
	fn3: (c: C) => D,
	fn4: (d: D) => E,
	fn5: (e: E) => F,
	fn6: (f: F) => G,
	fn7: (g: G) => H,
): PipeResult<
	[
		(a: A) => B,
		(b: B) => C,
		(c: C) => D,
		(d: D) => E,
		(e: E) => F,
		(f: F) => G,
		(g: G) => H,
	]
>;
export function pipe<A, B, C, D, E, F, G, H, I>(
	fn1: (a: A) => B,
	fn2: (b: B) => C,
	fn3: (c: C) => D,
	fn4: (d: D) => E,
	fn5: (e: E) => F,
	fn6: (f: F) => G,
	fn7: (g: G) => H,
	fn8: (h: H) => I,
): PipeResult<
	[
		(a: A) => B,
		(b: B) => C,
		(c: C) => D,
		(d: D) => E,
		(e: E) => F,
		(f: F) => G,
		(g: G) => H,
		(h: H) => I,
	]
>;
export function pipe<A, B, C, D, E, F, G, H, I, J>(
	fn1: (a: A) => B,
	fn2: (b: B) => C,
	fn3: (c: C) => D,
	fn4: (d: D) => E,
	fn5: (e: E) => F,
	fn6: (f: F) => G,
	fn7: (g: G) => H,
	fn8: (h: H) => I,
	fn9: (i: I) => J,
): PipeResult<
	[
		(a: A) => B,
		(b: B) => C,
		(c: C) => D,
		(d: D) => E,
		(e: E) => F,
		(f: F) => G,
		(g: G) => H,
		(h: H) => I,
		(i: I) => J,
	]
>;
/** 超过 10 步时的递归兜底（首尾类型推导，中间步骤需注解） */
export function pipe(
	...fns: ((...args: any[]) => any)[]
): PipeResult<typeof fns>;
export function pipe(...fns: Function[]) {
	const run: any = (input: any) => fns.reduce((acc, fn) => fn(acc), input);
	run.extends = (...newFns: Function[]) =>
		pipe(...([...fns, ...newFns] as ((...args: any[]) => any)[]));
	return run;
}

// 异步版本：支持中间类型推导 + .extends()

export type PipeAsyncResult<Fns extends ((...args: any[]) => any)[]> =
	Fns extends [(...args: any[]) => any, ...any[]]
		? ((
				arg: Parameters<Fns[0]>[0],
			) => Promise<
				ReturnType<
					Fns extends [...any[], infer Last extends (...args: any[]) => any]
						? Last
						: never
				>
			>) & {
				extends: <NewFns extends ((...args: any[]) => any)[]>(
					...fns: NewFns
				) => PipeAsyncResult<[...Fns, ...NewFns]>;
			}
		: ((arg: any) => Promise<any>) & {
				extends: <NewFns extends ((...args: any[]) => any)[]>(
					...fns: NewFns
				) => PipeAsyncResult<NewFns>;
			};

export function pipeAsync<A, B>(
	fn1: (a: A) => B | Promise<B>,
): PipeAsyncResult<[(a: A) => B | Promise<B>]>;
export function pipeAsync<A, B, C>(
	fn1: (a: A) => B | Promise<B>,
	fn2: (b: B) => C | Promise<C>,
): PipeAsyncResult<[(a: A) => B | Promise<B>, (b: B) => C | Promise<C>]>;
export function pipeAsync<A, B, C, D>(
	fn1: (a: A) => B | Promise<B>,
	fn2: (b: B) => C | Promise<C>,
	fn3: (c: C) => D | Promise<D>,
): PipeAsyncResult<
	[(a: A) => B | Promise<B>, (b: B) => C | Promise<C>, (c: C) => D | Promise<D>]
>;
export function pipeAsync<A, B, C, D, E>(
	fn1: (a: A) => B | Promise<B>,
	fn2: (b: B) => C | Promise<C>,
	fn3: (c: C) => D | Promise<D>,
	fn4: (d: D) => E | Promise<E>,
): PipeAsyncResult<
	[
		(a: A) => B | Promise<B>,
		(b: B) => C | Promise<C>,
		(c: C) => D | Promise<D>,
		(d: D) => E | Promise<E>,
	]
>;
export function pipeAsync<A, B, C, D, E, F>(
	fn1: (a: A) => B | Promise<B>,
	fn2: (b: B) => C | Promise<C>,
	fn3: (c: C) => D | Promise<D>,
	fn4: (d: D) => E | Promise<E>,
	fn5: (e: E) => F | Promise<F>,
): PipeAsyncResult<
	[
		(a: A) => B | Promise<B>,
		(b: B) => C | Promise<C>,
		(c: C) => D | Promise<D>,
		(d: D) => E | Promise<E>,
		(e: E) => F | Promise<F>,
	]
>;
export function pipeAsync<A, B, C, D, E, F, G>(
	fn1: (a: A) => B | Promise<B>,
	fn2: (b: B) => C | Promise<C>,
	fn3: (c: C) => D | Promise<D>,
	fn4: (d: D) => E | Promise<E>,
	fn5: (e: E) => F | Promise<F>,
	fn6: (f: F) => G | Promise<G>,
): PipeAsyncResult<
	[
		(a: A) => B | Promise<B>,
		(b: B) => C | Promise<C>,
		(c: C) => D | Promise<D>,
		(d: D) => E | Promise<E>,
		(e: E) => F | Promise<F>,
		(f: F) => G | Promise<G>,
	]
>;
export function pipeAsync<A, B, C, D, E, F, G, H>(
	fn1: (a: A) => B | Promise<B>,
	fn2: (b: B) => C | Promise<C>,
	fn3: (c: C) => D | Promise<D>,
	fn4: (d: D) => E | Promise<E>,
	fn5: (e: E) => F | Promise<F>,
	fn6: (f: F) => G | Promise<G>,
	fn7: (g: G) => H | Promise<H>,
): PipeAsyncResult<
	[
		(a: A) => B | Promise<B>,
		(b: B) => C | Promise<C>,
		(c: C) => D | Promise<D>,
		(d: D) => E | Promise<E>,
		(e: E) => F | Promise<F>,
		(f: F) => G | Promise<G>,
		(g: G) => H | Promise<H>,
	]
>;
export function pipeAsync<A, B, C, D, E, F, G, H, I>(
	fn1: (a: A) => B | Promise<B>,
	fn2: (b: B) => C | Promise<C>,
	fn3: (c: C) => D | Promise<D>,
	fn4: (d: D) => E | Promise<E>,
	fn5: (e: E) => F | Promise<F>,
	fn6: (f: F) => G | Promise<G>,
	fn7: (g: G) => H | Promise<H>,
	fn8: (h: H) => I | Promise<I>,
): PipeAsyncResult<
	[
		(a: A) => B | Promise<B>,
		(b: B) => C | Promise<C>,
		(c: C) => D | Promise<D>,
		(d: D) => E | Promise<E>,
		(e: E) => F | Promise<F>,
		(f: F) => G | Promise<G>,
		(g: G) => H | Promise<H>,
		(h: H) => I | Promise<I>,
	]
>;
export function pipeAsync<A, B, C, D, E, F, G, H, I, J>(
	fn1: (a: A) => B | Promise<B>,
	fn2: (b: B) => C | Promise<C>,
	fn3: (c: C) => D | Promise<D>,
	fn4: (d: D) => E | Promise<E>,
	fn5: (e: E) => F | Promise<F>,
	fn6: (f: F) => G | Promise<G>,
	fn7: (g: G) => H | Promise<H>,
	fn8: (h: H) => I | Promise<I>,
	fn9: (i: I) => J | Promise<J>,
): PipeAsyncResult<
	[
		(a: A) => B | Promise<B>,
		(b: B) => C | Promise<C>,
		(c: C) => D | Promise<D>,
		(d: D) => E | Promise<E>,
		(e: E) => F | Promise<F>,
		(f: F) => G | Promise<G>,
		(g: G) => H | Promise<H>,
		(h: H) => I | Promise<I>,
		(i: I) => J | Promise<J>,
	]
>;
/** 超过 10 步时的递归兜底 */
export function pipeAsync(
	...fns: ((...args: any[]) => any)[]
): PipeAsyncResult<typeof fns>;
export function pipeAsync(...fns: Function[]) {
	const run: any = async (input: any) => {
		let value = input;
		for (const fn of fns) {
			value = await fn(value);
		}
		return value;
	};
	run.extends = (...newFns: Function[]) =>
		pipeAsync(...([...fns, ...newFns] as ((...args: any[]) => any)[]));
	return run;
}
