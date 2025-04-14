// // --- Higher-Kinded Type Emulation ---
// export interface HKT<F, A> {
// 	readonly _URI: F;
// 	readonly _A: A;
// }

// // Utility mapping from URI to concrete type
// export interface URItoKind<A> {
// 	Task: Task<A>;
// 	Option: Option<A>;
// 	IO: IO<A>;
// 	Reader: Reader<any, A>;
// 	Writer: Writer<any, A>;
// 	State: State<any, A>;
// 	AsyncResult: AsyncResult<any, A>;
// }

// export type Kind<F extends keyof URItoKind<any>, A> = URItoKind<A>[F];

// // --- Typeclass Interfaces ---
// export interface Functor<F extends keyof URItoKind<any>> {
// 	map<A, B>(fa: Kind<F, A>, f: (a: A) => B): Kind<F, B>;
// }

// export interface Applicative<F extends keyof URItoKind<any>>
// 	extends Functor<F> {
// 	of<A>(a: A): Kind<F, A>;
// 	ap<A, B>(fab: Kind<F, (a: A) => B>, fa: Kind<F, A>): Kind<F, B>;
// }

// export interface Monad<F extends keyof URItoKind<any>> extends Applicative<F> {
// 	flatMap<A, B>(fa: Kind<F, A>, f: (a: A) => Kind<F, B>): Kind<F, B>;
// }

// export interface Foldable<F extends keyof URItoKind<any>> {
// 	fold<A, B>(fa: Kind<F, A>, init: B, f: (acc: B, a: A) => B): B;
// }

// export interface Traversable<F extends keyof URItoKind<any>>
// 	extends Functor<F>,
// 		Foldable<F> {
// 	traverse<G extends keyof URItoKind<any>, A, B>(
// 		applicative: Applicative<G>,
// 		f: (a: A) => Kind<G, B>,
// 		ta: Kind<F, A>
// 	): Kind<G, Kind<F, B>>;
// }

// // --- Task Monad ---
// export class Task<A> implements HKT<"Task", A> {
// 	readonly _URI!: "Task";
// 	readonly _A!: A;

// 	constructor(public readonly run: () => Promise<A>) {}

// 	static of<A>(a: A): Task<A> {
// 		return new Task(() => Promise.resolve(a));
// 	}

// 	map<B>(f: (a: A) => B): Task<B> {
// 		return new Task(() => this.run().then(f));
// 	}

// 	flatMap<B>(f: (a: A) => Task<B>): Task<B> {
// 		return new Task(() => this.run().then((a) => f(a).run()));
// 	}
// }

// export const TaskMonad: Monad<"Task"> = {
// 	map: (fa, f) => fa.map(f),
// 	of: Task.of,
// 	ap: (fab, fa) => fab.flatMap((f: (a: any) => any) => fa.map(f)),
// 	flatMap: (fa, f) => fa.flatMap(f),
// };

// // --- Option Monad ---
// export type Option<A> = Some<A> | None;

// export class Some<A> {
// 	readonly _tag = "Some";
// 	constructor(public readonly value: A) {}
// }

// export class None {
// 	readonly _tag = "None";
// }

// export const OptionMonad: Monad<"Option"> = {
// 	of: <A>(a: A): Option<A> => new Some(a),
// 	map: (fa, f) => (fa instanceof Some ? new Some(f(fa.value)) : fa),
// 	ap: (fab, fa) =>
// 		fab instanceof Some && fa instanceof Some
// 			? new Some(fab.value(fa.value))
// 			: new None(),
// 	flatMap: (fa, f) => (fa instanceof Some ? f(fa.value) : new None()),
// };

// // --- IO Monad ---
// export class IO<A> implements HKT<"IO", A> {
// 	readonly _URI!: "IO";
// 	readonly _A!: A;

// 	constructor(public readonly run: () => A) {}

// 	static of<A>(a: A): IO<A> {
// 		return new IO(() => a);
// 	}

// 	map<B>(f: (a: A) => B): IO<B> {
// 		return new IO(() => f(this.run()));
// 	}

// 	flatMap<B>(f: (a: A) => IO<B>): IO<B> {
// 		return new IO(() => f(this.run()).run());
// 	}
// }

// // --- Reader Monad ---
// export class Reader<R, A> implements HKT<"Reader", A> {
// 	readonly _URI!: "Reader";
// 	readonly _A!: A;

// 	constructor(public readonly run: (env: R) => A) {}

// 	static of<R, A>(a: A): Reader<R, A> {
// 		return new Reader(() => a);
// 	}

// 	map<B>(f: (a: A) => B): Reader<R, B> {
// 		return new Reader((r) => f(this.run(r)));
// 	}

// 	flatMap<B>(f: (a: A) => Reader<R, B>): Reader<R, B> {
// 		return new Reader((r) => f(this.run(r)).run(r));
// 	}
// }

// // --- Writer Monad ---
// export class Writer<W, A> implements HKT<"Writer", A> {
// 	readonly _URI!: "Writer";
// 	readonly _A!: A;

// 	constructor(public readonly value: A, public readonly log: W) {}

// 	static of<W, A>(a: A, emptyLog: W): Writer<W, A> {
// 		return new Writer(a, emptyLog);
// 	}

// 	map<B>(f: (a: A) => B): Writer<W, B> {
// 		return new Writer(f(this.value), this.log);
// 	}

// 	flatMap<B>(
// 		f: (a: A) => Writer<W, B>,
// 		concat: (w1: W, w2: W) => W
// 	): Writer<W, B> {
// 		const result = f(this.value);
// 		return new Writer(result.value, concat(this.log, result.log));
// 	}
// }

// // --- JSON Schema Generator ---
// export type JSONSchema = {
// 	type?: string;
// 	properties?: Record<string, JSONSchema>;
// 	items?: JSONSchema;
// 	enum?: any[];
// 	oneOf?: JSONSchema[];
// 	default?: any;
// 	description?: string;
// 	required?: string[];
// };

// export function schemaFrom<T>(example: T): JSONSchema {
// 	if (Array.isArray(example)) {
// 		return { type: "array", items: schemaFrom(example[0]) };
// 	} else if (typeof example === "object" && example !== null) {
// 		const properties: Record<string, JSONSchema> = {};
// 		const required: string[] = [];
// 		for (const key in example) {
// 			const value = (example as any)[key];
// 			const schema = schemaFrom(value);
// 			properties[key] = schema;
// 			required.push(key);
// 		}
// 		return { type: "object", properties, required };
// 	} else {
// 		return { type: typeof example };
// 	}
// }

// // --- Lens & Zipper ---
// export type Lens<S, A> = {
// 	get: (s: S) => A;
// 	set: (a: A, s: S) => S;
// };

// export function lens<S, A>(
// 	get: (s: S) => A,
// 	set: (a: A, s: S) => S
// ): Lens<S, A> {
// 	return { get, set };
// }

// export type Zipper<A> = {
// 	left: A[];
// 	focus: A;
// 	right: A[];
// };

// export function fromArray<A>(arr: A[]): Zipper<A> | null {
// 	if (arr.length === 0) return null;
// 	return { left: [], focus: arr[0], right: arr.slice(1) };
// }

// export function moveLeft<A>(z: Zipper<A>): Zipper<A> | null {
// 	if (z.left.length === 0) return null;
// 	const [newFocus, ...rest] = [...z.left].reverse();
// 	return {
// 		left: rest.reverse(),
// 		focus: newFocus,
// 		right: [z.focus, ...z.right],
// 	};
// }

// export function moveRight<A>(z: Zipper<A>): Zipper<A> | null {
// 	if (z.right.length === 0) return null;
// 	const [newFocus, ...rest] = z.right;
// 	return {
// 		left: [...z.left, z.focus],
// 		focus: newFocus,
// 		right: rest,
// 	};
// }

// // --- Either ---
// export type Either<L, R> = Left<L> | Right<R>;

// export class Left<L> {
// 	readonly _tag = "Left";
// 	constructor(public readonly value: L) {}
// 	isLeft(): this is Left<L> {
// 		return true;
// 	}
// 	isRight(): this is Right<any> {
// 		return false;
// 	}
// }

// export class Right<R> {
// 	readonly _tag = "Right";
// 	constructor(public readonly value: R) {}
// 	isLeft(): this is Left<any> {
// 		return false;
// 	}
// 	isRight(): this is Right<R> {
// 		return true;
// 	}
// }

// export class State<S, A> {
// 	constructor(public readonly run: (s: S) => [A, S]) {}

// 	static of<S, A>(a: A): State<S, A> {
// 		return new State((s) => [a, s]);
// 	}

// 	map<B>(f: (a: A) => B): State<S, B> {
// 		return new State((s) => {
// 			const [a, newState] = this.run(s);
// 			return [f(a), newState];
// 		});
// 	}

// 	flatMap<B>(f: (a: A) => State<S, B>): State<S, B> {
// 		return new State((s) => {
// 			const [a, newState] = this.run(s);
// 			return f(a).run(newState);
// 		});
// 	}
// }

// export const StateMonad: Monad<"State"> = {
// 	of: State.of,
// 	map: (fa, f) => fa.map(f),
// 	ap: (fab, fa) => fab.flatMap((f: any) => fa.map(f)),
// 	flatMap: (fa, f) => fa.flatMap(f),
// };

// export type Validation<E, A> = Failure<E> | Success<A>;

// export class Failure<E> {
// 	readonly _tag = "Failure";
// 	constructor(public readonly errors: E[]) {}

// 	isFailure(): this is Failure<E> {
// 		return true;
// 	}

// 	isSuccess(): this is Success<any> {
// 		return false;
// 	}
// }

// export class Success<A> {
// 	readonly _tag = "Success";
// 	constructor(public readonly value: A) {}

// 	isFailure(): this is Failure<any> {
// 		return false;
// 	}

// 	isSuccess(): this is Success<A> {
// 		return true;
// 	}
// }

// export const ValidationApplicative = {
// 	of: <E, A>(a: A): Validation<E, A> => new Success(a),

// 	ap: <E, A, B>(
// 		fab: Validation<E, (a: A) => B>,
// 		fa: Validation<E, A>
// 	): Validation<E, B> => {
// 		if (fab.isSuccess() && fa.isSuccess()) {
// 			return new Success(fab.value(fa.value));
// 		} else {
// 			const errors = [
// 				...(fab.isFailure() ? fab.errors : []),
// 				...(fa.isFailure() ? fa.errors : []),
// 			];
// 			return new Failure(errors);
// 		}
// 	},

// 	map: <E, A, B>(fa: Validation<E, A>, f: (a: A) => B): Validation<E, B> => {
// 		return fa.isSuccess() ? new Success(f(fa.value)) : fa;
// 	},
// };

// export class AsyncResult<E, A> {
// 	constructor(public readonly run: () => Promise<Either<E, A>>) {}

// 	static of<E, A>(a: A): AsyncResult<E, A> {
// 		return new AsyncResult(() => Promise.resolve(new Right(a)));
// 	}

// 	map<B>(f: (a: A) => B): AsyncResult<E, B> {
// 		return new AsyncResult(() =>
// 			this.run().then((res) => (res.isRight() ? new Right(f(res.value)) : res))
// 		);
// 	}

// 	flatMap<B>(f: (a: A) => AsyncResult<E, B>): AsyncResult<E, B> {
// 		return new AsyncResult(() =>
// 			this.run().then((res) =>
// 				res.isRight() ? f(res.value).run() : Promise.resolve(res as Left<E>)
// 			)
// 		);
// 	}
// }

// export const AsyncResultMonad: Monad<"AsyncResult"> = {
// 	of: AsyncResult.of,
// 	map: (fa, f) => fa.map(f),
// 	ap: (fab, fa) => fab.flatMap((f: any) => fa.map(f)),
// 	flatMap: (fa, f) => fa.flatMap(f),
// };
