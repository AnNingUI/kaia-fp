import { HKT } from "../core/hkt";
import { Monad } from "../core/typeClass";

export class LazyArray<A> implements HKT<"LazyArray", A> {
	readonly _URI!: "LazyArray";
	readonly _A!: A;

	constructor(private readonly genFn: () => Generator<A, void, unknown>) {}

	[Symbol.iterator](): Generator<A, void, unknown> {
		return this.genFn();
	}

	static of<A>(value: A): LazyArray<A> {
		return new LazyArray(function* () {
			yield value;
		});
	}

	static fromArray<A>(arr: A[]): LazyArray<A> {
		return new LazyArray(function* () {
			for (const item of arr) yield item;
		});
	}

	/** 取出第一个元素，无元素时返回 undefined。 */
	head(): A | undefined {
		const result = this.genFn().next();
		return result.done ? undefined : result.value;
	}

	/** 取前 n 个元素（惰性）。 */
	take(n: number): LazyArray<A> {
		const self = this;
		return new LazyArray(function* () {
			let count = 0;
			for (const item of self) {
				if (count++ >= n) return;
				yield item;
			}
		});
	}

	/** 跳过前 n 个元素（惰性）。 */
	drop(n: number): LazyArray<A> {
		const self = this;
		return new LazyArray(function* () {
			let count = 0;
			for (const item of self) {
				if (count++ < n) continue;
				yield item;
			}
		});
	}

	/** 立即消费：对每个元素执行副作用。 */
	applyEach<O>(f: (c: A) => O) {
		for (const item of this) {
			f(item);
		}
	}

	/** 惰性透传：返回新 LazyArray，遍历时对每个元素执行 f 并透传原值。 */
	forEach(f: (a: A) => void): LazyArray<A> {
		const self = this;
		return new LazyArray(function* () {
			for (const item of self) {
				f(item);
				yield item;
			}
		});
	}

	toArray(): A[] {
		return [...this];
	}

	map<B>(f: (a: A) => B): LazyArray<B> {
		const self = this;
		return new LazyArray(function* () {
			for (const item of self) yield f(item);
		});
	}

	filter(f: (a: A) => boolean): LazyArray<A> {
		const self = this;
		return new LazyArray(function* () {
			for (const item of self) {
				if (f(item)) yield item;
			}
		});
	}

	flatMap<B>(f: (a: A) => LazyArray<B>): LazyArray<B> {
		const self = this;
		return new LazyArray(function* () {
			for (const item of self) {
				yield* f(item);
			}
		});
	}
}

export const LazyArrayMonad: Monad<"LazyArray"> = {
	of: LazyArray.of,
	map: (fa, f) => (fa as LazyArray<any>).map(f),
	ap: (fab, fa) =>
		(fab as LazyArray<any>).flatMap((f: any) => (fa as LazyArray<any>).map(f)),
	flatMap: (fa, f) => (fa as LazyArray<any>).flatMap(f),
};
