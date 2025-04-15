export type Predicate<T> = (val: any) => val is T;

function not<T>(pred: Predicate<T>): Predicate<unknown> {
	return (val): val is unknown => !pred(val);
}

type WithInfer<T> = Predicate<T> & {
	/**
	 * ⚠️ Auxiliary field for type extraction, not available at runtime
	 */
	readonly inter: T;
};

type TupleType<T extends Predicate<any>[]> = {
	[K in keyof T]: T[K] extends Predicate<infer U> ? U : never;
};

function optional<T>(pred: Predicate<T>): Predicate<T | undefined> {
	return (val): val is T | undefined => val === undefined || pred(val);
}

function compose<T>(preds: ((val: any) => boolean)[]): Predicate<T> {
	return (val): val is T => preds.every((p) => p(val));
}

export const is = {
	// 基本类型匹配
	number: () => {
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
	},

	string: () => {
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
	},

	boolean: (): { match: Predicate<boolean> } => ({
		match: (v): v is boolean => typeof v === "boolean",
	}),

	array: <T>(element: Predicate<T>) => ({
		every: (v: unknown): v is T[] => Array.isArray(v) && v.every(element),
		some: (v: unknown): v is T[] => Array.isArray(v) && v.some(element),
	}),
	date:
		(): Predicate<Date> =>
		(val): val is Date =>
			val instanceof Date,
	bigint:
		(): Predicate<bigint> =>
		(val): val is bigint =>
			typeof val === "bigint",
	shape: <T extends Record<string, Predicate<any>>>(
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
	},

	tuple: <T extends Predicate<any>[]>(elements: [...T]) => {
		return (val: any): val is TupleType<T> =>
			Array.isArray(val) &&
			val.length === elements.length &&
			elements.every((p, i) => p(val[i]));
	},

	union: <U extends Predicate<any>[]>(...variants: [...U]) => {
		return (
			val: any
		): val is U[number] extends Predicate<infer T> ? T : never =>
			variants.some((fn) => fn(val));
	},

	literal: <T extends string | number | boolean>(value: T): Predicate<T> => {
		return (val): val is T => val === value;
	},

	not,
	optional,
};
