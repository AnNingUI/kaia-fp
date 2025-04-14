import { HKT } from "@core/hkt";
import { Monad } from "@core/typeClass";

export class Reader<R, A> implements HKT<"Reader", A> {
	readonly _URI!: "Reader";
	readonly _A!: A;

	constructor(public readonly run: (env: R) => A) {}

	static of<R, A>(a: A): Reader<R, A> {
		return new Reader(() => a);
	}

	map<B>(f: (a: A) => B): Reader<R, B> {
		return new Reader((r) => f(this.run(r)));
	}

	ap<B>(fab: Reader<R, (a: A) => B>): Reader<R, B> {
		return new Reader((r) => fab.run(r)(this.run(r)));
	}

	flatMap<B>(f: (a: A) => Reader<R, B>): Reader<R, B> {
		return new Reader((r) => f(this.run(r)).run(r));
	}

	local(f: (r: R) => R): Reader<R, A> {
		return new Reader((r) => this.run(f(r)));
	}
}

export const ReaderMonad: Monad<"Reader"> = {
	of: Reader.of,
	map: (fa, f) => fa.map(f),
	ap: (fab, fa) => fa.ap(fab as Reader<any, (a: any) => any>),
	flatMap: (fa, f) => fa.flatMap(f),
};
