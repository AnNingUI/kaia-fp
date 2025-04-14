// is.ts
export type Predicate<T> = (val: any) => val is T;

function not<T>(pred: Predicate<T>): Predicate<unknown> {
	return (val): val is unknown => !pred(val);
}

function optional<T>(pred: Predicate<T>): Predicate<T | undefined> {
	return (val): val is T | undefined => val === undefined || pred(val);
}

function compose<T>(preds: ((val: any) => boolean)[]): Predicate<T> {
	return (val): val is T => preds.every((p) => p(val));
}

export const is = {
	number: () => {
		const preds: ((v: any) => boolean)[] = [(v) => typeof v === "number"];
		const self = {
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

	shape: <T extends Record<string, Predicate<any>>>(
		shape: T
	): Predicate<{
		[K in keyof T]: T[K] extends Predicate<infer U> ? U : never;
	}> => {
		return (val: any): val is any =>
			typeof val === "object" &&
			val !== null &&
			Object.entries(shape).every(([k, pred]) => pred((val as any)[k]));
	},

	tuple: <T extends Predicate<any>[]>(elements: [...T]) => {
		return (
			val: any
		): val is { [K in keyof T]: T[K] extends Predicate<infer U> ? U : never } =>
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
