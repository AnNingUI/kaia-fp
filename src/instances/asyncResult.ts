// src/instances/asyncResult.ts
import { HKT } from "../core/hkt";
import { makeMonad } from "../core/utils";
import { Either, Left, Right } from "../utils/either";

export class AsyncResult<E, A> implements HKT<"AsyncResult", A> {
	readonly _URI!: "AsyncResult";
	readonly _A!: A;

	constructor(public readonly run: () => Promise<Either<E, A>>) {}

	// 修复点1：正确设置错误类型为never
	static of<A>(a: A): AsyncResult<never, A> {
		return new AsyncResult(() => Promise.resolve(new Right(a))) as AsyncResult<
			never,
			A
		>;
	}

	map<B>(f: (a: A) => B): AsyncResult<E, B> {
		return new AsyncResult(() =>
			this.run()
				.then((res) => (res.isRight() ? new Right(f(res.value)) : res))
				.catch((e) => new Left(e as E))
		);
	}

	// 修复点2：添加显式类型参数
	flatMap<B>(f: (a: A) => AsyncResult<E, B>): AsyncResult<E, B> {
		return new AsyncResult(() =>
			this.run()
				.then((res) => {
					if (res.isRight()) {
						return f(res.value).run();
					}
					return res as Left<E>;
				})
				.catch((e) => new Left(e as E))
		);
	}

	// 从 Promise 构造，rejection 自动转为 Left
	static fromPromise<A, E = unknown>(p: Promise<A>): AsyncResult<E, A> {
		return new AsyncResult(() =>
			p.then((a) => new Right(a)).catch((e) => new Left(e as E))
		);
	}
}

// 修复点3：修正Monad实例类型
export const AsyncResultMonad = makeMonad(
	"AsyncResult",
	AsyncResult,
	AsyncResult.of
);
