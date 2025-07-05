import { HKT } from "../core/hkt";
import { Monad } from "../core/typeClass";

// export type Options<A> = Some<A> | A extends <A, B>(fa: Options<A>, f: (a: A) => B) => Options<B> extends <A, B>(fa: Options<A>, f: (a: A) => B) => Options<B> extends <A, B>(fa: Options<A>, f: (a: A) => B) => Options<B>one;
type OptionsValue<A> = Some<A> | None;
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

	public match<B>({ some, none }: { some: (value: A) => B; none: () => B }): B {
		if (this.isSome()) {
			return some?.(this.value!);
		} else {
			return none?.();
		}
	}

	public flatMap<B>(f: (a: A) => Options<B>) {
		if (this.isSome()) {
			return f(this.value!);
		} else {
			return None.of() as Options<B>;
		}
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

	private static INSTANCE: None;

	private constructor() {
		super(null);
	}

	public static of(): None {
		if (!this.INSTANCE) {
			this.INSTANCE = new None();
			return this.INSTANCE;
		} else {
			return this.INSTANCE as None;
		}
	}
}

export const OptionMonad: {
	none: () => None;
} & Monad<"Options"> = {
	none: () => None.of(),
	of: <A>(a: A): Options<A> => new Some(a),
	map: (fa, f) => (fa instanceof Some ? new Some(f(fa.value)) : None.of()),
	ap: (fab, fa) =>
		fab instanceof Some && fa instanceof Some
			? new Some(fab.value(fa.value))
			: None.of(),
	flatMap: (fa, f) => (fa instanceof Some ? f(fa.value) : None.of()),
};

const isNull = (value: any) => {
	return value === null || value === undefined;
};
