import { HKT } from "../core/hkt";
import { Monad } from "../core/typeClass";

// export type Options<A> = Some<A> | A extends <A, B>(fa: Options<A>, f: (a: A) => B) => Options<B> extends <A, B>(fa: Options<A>, f: (a: A) => B) => Options<B> extends <A, B>(fa: Options<A>, f: (a: A) => B) => Options<B>one;
type OptionsValue = Some<any> | None;
export class Options<A> implements HKT<"Options", A> {
	readonly _URI!: "Options";
	readonly _A!: A;
	readonly _tag?: "Some" | "None";

	constructor(public readonly value: A | null) {}

	public isNone() {
		return this.value === null && this instanceof None && this._tag === "None";
	}

	public isSome() {
		return this.value !== null && this instanceof Some && this._tag === "Some";
	}

	public orElse<B>(value: B): Options<A | B> {
		return this.isNone() ? new Some(value) : this;
	}

	public get() {
		if (this.value === null) {
			throw new Error("Option.get called on None");
		}
		return this.value;
	}

	public getOrElse<B>(defaultValue: B): A | B {
		return this.isSome() ? (this.value as A) : defaultValue;
	}
}

export class Some<A> extends Options<A> implements HKT<"Options", A> {
	readonly _URI!: "Options";
	readonly _A!: A;
	readonly _tag = "Some";

	constructor(public readonly value: A) {
		super(value);
	}
}

export class None extends Options<never> implements HKT<"Options", never> {
	readonly _URI!: "Options";
	readonly _A!: never;
	readonly _tag = "None";
	readonly value = null;

	constructor() {
		super(null);
	}
}

export const OptionMonad: {
	none: () => None;
} & Monad<"Options"> = {
	none: () => new None(),
	of: <A>(a: A): Options<A> => new Some(a),
	map: (fa, f) => (fa instanceof Some ? new Some(f(fa.value)) : new None()),
	ap: (fab, fa) =>
		fab instanceof Some && fa instanceof Some
			? new Some(fab.value(fa.value))
			: new None(),
	flatMap: (fa, f) => (fa instanceof Some ? f(fa.value) : new None()),
};

const isNull = (value: any) => {
	return value === null || value === undefined;
};
