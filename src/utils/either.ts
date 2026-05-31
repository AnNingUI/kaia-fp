export type Either<L, R> = Left<L> | Right<R>;

class EitherBase<L, R> {
	readonly value!: L | R;

	static is(v: any): v is Either<any, any> {
		return v instanceof Left || v instanceof Right;
	}

	isLeft(): this is Left<L> {
		return false;
	}

	isRight(): this is Right<R> {
		return false;
	}

	match<B>({ left, right }: { left: (l: L) => B; right: (r: R) => B }): B {
		if (this.isLeft()) {
			return left(this.value as L);
		}
		return right(this.value as R);
	}

	map<B>(f: (r: R) => B): Either<L, B> {
		if (this.isRight()) {
			return new Right(f(this.value as R));
		}
		return new Left(this.value as L);
	}

	mapLeft<B>(f: (l: L) => B): Either<B, R> {
		if (this.isLeft()) {
			return new Left(f(this.value as L));
		}
		return new Right(this.value as R);
	}

	flatMap<B>(f: (r: R) => Either<L, B>): Either<L, B> {
		if (this.isRight()) {
			return f(this.value as R);
		}
		return new Left(this.value as L);
	}

	fold<B>(onLeft: (l: L) => B, onRight: (r: R) => B): B {
		if (this.isLeft()) {
			return onLeft(this.value as L);
		}
		return onRight(this.value as R);
	}

	getOrElse<B>(defaultValue: B): R | B {
		return this.isRight() ? (this.value as R) : defaultValue;
	}

	orElse<B>(fallback: Either<B, R>): Either<L | B, R> {
		return this.isRight() ? (this as unknown as Either<L | B, R>) : fallback;
	}

	filter<B>(predicate: (r: R) => boolean, onFalse: () => B): Either<L | B, R> {
		if (this.isRight() && !predicate(this.value as R)) {
			return new Left(onFalse());
		}
		return this as unknown as Either<L | B, R>;
	}

	swap(): Either<R, L> {
		if (this.isRight()) {
			return new Left(this.value as R);
		}
		return new Right(this.value as L);
	}

	bimap<L2, R2>(f: (l: L) => L2, g: (r: R) => R2): Either<L2, R2> {
		if (this.isLeft()) {
			return new Left(f(this.value as L));
		}
		return new Right(g(this.value as R));
	}
}

export class Left<L> extends EitherBase<L, never> {
	readonly _tag = "Left";
	constructor(public readonly value: L) {
		super();
	}

	override isLeft(): this is Left<L> {
		return true;
	}

	override isRight(): this is Right<never> {
		return false;
	}
}

export class Right<R> extends EitherBase<never, R> {
	readonly _tag = "Right";
	constructor(public readonly value: R) {
		super();
	}

	public get() {
		return this.value;
	}

	public to<B>(t: (v: R) => B | Promise<B> | void | Promise<void>) {
		return t(this.value);
	}

	override isLeft(): this is Left<never> {
		return false;
	}

	override isRight(): this is Right<R> {
		return true;
	}
}

/** Convert a nullable value to Either. null/undefined → Left(error), otherwise → Right(value). */
export function fromNullable<E, A>(error: E): (value: A | null | undefined) => Either<E, NonNullable<A>> {
	return (value) =>
		value === null || value === undefined
			? new Left(error)
			: new Right(value as NonNullable<A>);
}
