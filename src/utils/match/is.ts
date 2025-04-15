import { Either, Left, Right } from "@utils/either";

export type Predicate<T> = (val: any) => val is T;

function not<T>(pred: Predicate<T>): Predicate<unknown> {
	return (val): val is unknown => !pred(val);
}

function wrap<T>(predicate: Predicate<T>) {
	return {
		match: predicate,
		or: <U>(alt: Predicate<U>) =>
			wrap((val): val is T | U => predicate(val) || alt(val)),
	};
}

export type WithInfer<T> = Predicate<T> & {
	/**
	 * ⚠️ Auxiliary field for type extraction, not available at runtime
	 */
	readonly inter: T;
};

export type TupleType<T extends Predicate<any>[]> = {
	[K in keyof T]: T[K] extends Predicate<infer U> ? U : never;
};

function optional<T>(pred: Predicate<T>): Predicate<T | undefined> {
	return (val): val is T | undefined => val === undefined || pred(val);
}

function compose<T>(preds: ((val: any) => boolean)[]): Predicate<T> {
	return (val): val is T => preds.every((p) => p(val));
}

const isNumber = () => {
	const preds: ((v: any) => boolean)[] = [(v) => typeof v === "number"];
	const self = {
		toBool(to: (n: number) => boolean) {
			preds.push((v) => to(v));
			return self;
		},
		gt(n: number) {
			preds.push((v) => v > n);
			return self;
		},
		lt(n: number) {
			preds.push((v) => v < n);
			return self;
		},
		eq(n: number) {
			preds.push((v) => v === n);
			return self;
		},
		match: compose<number>(preds),
	};
	return self;
};
const isString = () => {
	const preds: ((v: any) => boolean)[] = [(v) => typeof v === "string"];
	const self = {
		toBool(to: (n: string) => boolean) {
			preds.push((v) => to(v));
			return self;
		},
		test(r: RegExp) {
			preds.push((v) => r.test(v));
			return self;
		},
		includes(substr: string) {
			preds.push((v) => v.includes(substr));
			return self;
		},
		match: compose<string>(preds),
	};
	return self;
};

const isBoolean = (): { match: Predicate<boolean> } => ({
	match: (v): v is boolean => typeof v === "boolean",
});

const isArray = <T>(element: Predicate<T>) => ({
	every: (v: unknown): v is T[] => Array.isArray(v) && v.every(element),
	some: (v: unknown): v is T[] => Array.isArray(v) && v.some(element),
});

const isDate =
	(): Predicate<Date> =>
	(val): val is Date =>
		val instanceof Date;

const isBigint =
	(): Predicate<bigint> =>
	(val): val is bigint =>
		typeof val === "bigint";

const isShape = <T extends Record<string, Predicate<any>>>(
	shape: T
): WithInfer<{
	[K in keyof T]: T[K] extends Predicate<infer U> ? U : never;
}> => {
	type Inferred = {
		[K in keyof T]: T[K] extends Predicate<infer U> ? U : never;
	};

	const fn = ((val: any): val is Inferred => {
		if (typeof val !== "object" || val === null) return false;
		for (const key in shape) {
			if (!shape[key]((val as any)[key])) return false;
		}
		return true;
	}) as WithInfer<Inferred>;

	// @ts-expect-error only for static type extraction
	fn.inter = undefined;

	return fn;
};
const isTuple = <T extends Predicate<any>[]>(elements: [...T]) => {
	return (val: any): val is TupleType<T> =>
		Array.isArray(val) &&
		val.length === elements.length &&
		elements.every((p, i) => p(val[i]));
};
const isUnion = <U extends Predicate<any>[]>(...variants: [...U]) => {
	return (val: any): val is U[number] extends Predicate<infer T> ? T : never =>
		variants.some((fn) => fn(val));
};
const isLiteral = <T extends string | number | boolean | null | undefined>(
	expected: T
) => {
	const predicate = (val: any): val is T => val === expected;

	// 直接暴露 predicate 和 match 两种形式
	predicate.match = predicate;

	return predicate;
};
const isEither = <L, R>() => {
	return {
		shape: (
			leftPred: ReturnType<typeof wrap<L>>,
			rightPred: ReturnType<typeof wrap<R>>
		) =>
			wrap<Either<L, R>>((val): val is Either<L, R> =>
				val instanceof Left
					? leftPred.match(val.value)
					: val instanceof Right
					? rightPred.match(val.value)
					: false
			),

		left: Object.assign(
			(pred: ReturnType<typeof wrap<L>>) =>
				wrap<Left<L>>(
					(val): val is Left<L> => val instanceof Left && pred.match(val.value)
				),
			// 修改这里：将 Left<unknown> 改为 Left<any>
			wrap((val: unknown): val is Left<L> => val instanceof Left)
		),

		right: Object.assign(
			(pred: ReturnType<typeof wrap<R>>) =>
				wrap<Right<R>>(
					(val): val is Right<R> =>
						val instanceof Right && pred.match(val.value)
				),
			// 修改这里：将 Right<unknown> 改为 Right<any>
			wrap((val: unknown): val is Right<R> => val instanceof Right)
		),
	};
};
export interface IsTypes {
	number: typeof isNumber;
	string: typeof isString;
	boolean: typeof isBoolean;
	array: typeof isArray;
	date: typeof isDate;
	bigint: typeof isBigint;
	shape: typeof isShape;
	tuple: typeof isTuple;
	union: typeof isUnion;
	literal: typeof isLiteral;
	either: typeof isEither;
	not: typeof not;
	optional: typeof optional;
}
export const is: IsTypes = {
	number: isNumber,
	string: isString,
	boolean: isBoolean,
	array: isArray,
	date: isDate,
	bigint: isBigint,
	shape: isShape,
	tuple: isTuple,
	union: isUnion,
	literal: isLiteral,
	either: isEither,
	not,
	optional,
};
