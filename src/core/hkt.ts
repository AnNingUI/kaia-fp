import type {
	AsyncResult,
	IO,
	LazyArray,
	Options,
	Reader,
	State,
	Task,
	Writer,
} from "../instances/index";

export interface HKT<F, A> {
	readonly _URI: F;
	readonly _A: A;
}

export interface URItoKind<A> {
	Task: Task<A>;
	Options: Options<A>;
	IO: IO<A>;
	Reader: Reader<any, A>;
	Writer: Writer<any, A>;
	State: State<any, A>;
	AsyncResult: AsyncResult<any, A>;
	LazyArray: LazyArray<A>;
}

export type Kind<F extends keyof URItoKind<A>, A> = URItoKind<A>[F];
