export type Either<L, R> = Left<L> | Right<R>;

export class Left<L> {
	readonly _tag = "Left";
	constructor(public readonly value: L) {}

	isLeft(): this is Left<L> {
		return true;
	}

	isRight(): this is Right<never> {
		return false;
	}
}

export class Right<R> {
	readonly _tag = "Right";
	constructor(public readonly value: R) {}

	isLeft(): this is Left<never> {
		return false;
	}

	isRight(): this is Right<R> {
		return true;
	}
}
