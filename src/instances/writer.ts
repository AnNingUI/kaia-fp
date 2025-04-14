import { HKT } from "@core/hkt";
import { Monad } from "@core/typeClass";

export class Writer<W, A> implements HKT<"Writer", A> {
	readonly _URI!: "Writer";
	readonly _A!: A;

	constructor(
		public readonly value: A,
		public readonly log: W,
		private readonly monoid: { empty: W; concat: (w1: W, w2: W) => W }
	) {}

	static of<W, A>(
		monoid: { empty: W; concat: (w1: W, w2: W) => W },
		a: A
	): Writer<W, A> {
		return new Writer(a, monoid.empty, monoid);
	}

	map<B>(f: (a: A) => B): Writer<W, B> {
		return new Writer(f(this.value), this.log, this.monoid);
	}

	ap<B>(fab: Writer<W, (a: A) => B>): Writer<W, B> {
		return new Writer(
			fab.value(this.value),
			this.monoid.concat(fab.log, this.log),
			this.monoid
		);
	}

	flatMap<B>(f: (a: A) => Writer<W, B>): Writer<W, B> {
		const result = f(this.value);
		return new Writer(
			result.value,
			this.monoid.concat(this.log, result.log),
			this.monoid
		);
	}

	listen(): Writer<W, [A, W]> {
		return new Writer([this.value, this.log], this.log, this.monoid);
	}
}

export const WriterMonad = <W>(monoid: {
	empty: W;
	concat: (w1: W, w2: W) => W;
}): Monad<"Writer"> => ({
	of: (a) => Writer.of(monoid, a),
	map: (fa, f) => fa.map(f),
	ap: (fab, fa) => fa.ap(fab as Writer<W, (a: any) => any>),
	flatMap: (fa, f) => fa.flatMap(f),
});
