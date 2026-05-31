import { HKT } from "../core/hkt";
import { makeMonad } from "../core/utils";

export class Task<A> implements HKT<"Task", A> {
	readonly _URI!: "Task";
	readonly _A!: A;

	constructor(public readonly run: () => Promise<A>) {}

	static of<A>(a: A): Task<A> {
		return new Task(() => Promise.resolve(a));
	}

	static reject<E>(e: E): Task<never> {
		return new Task(() => Promise.reject(e));
	}

	static fromPromise<A>(p: Promise<A>): Task<A> {
		return new Task(() => p);
	}

	static all<A>(tasks: Task<A>[]): Task<A[]> {
		return new Task(() => Promise.all(tasks.map((t) => t.run())));
	}

	static race<A>(tasks: Task<A>[]): Task<A> {
		return new Task(() => Promise.race(tasks.map((t) => t.run())));
	}

	map<B>(f: (a: A) => B): Task<B> {
		return new Task(() => this.run().then(f));
	}

	flatMap<B>(f: (a: A) => Task<B>): Task<B> {
		return new Task(() => this.run().then((a) => f(a).run()));
	}

	ap<B>(fab: Task<(a: A) => B>): Task<B> {
		return new Task(() =>
			Promise.all([fab.run(), this.run()]).then(([f, a]) => f(a))
		);
	}

	/** Convert a failed Task into a successful one by providing a recovery value. */
	recover<B = A>(f: (e: unknown) => B): Task<A | B> {
		return new Task(() => this.run().catch(f));
	}

	/** Convert a failed Task into a successful one by providing a recovery Task. */
	recoverWith<B = A>(f: (e: unknown) => Task<B>): Task<A | B> {
		return new Task(() => this.run().catch((e) => f(e).run()));
	}
}

export const TaskMonad = makeMonad(
	"Task",
	Task,
	Task.of,
	<A, B>(fab: Task<(a: A) => B>, fa: Task<A>) => fa.ap(fab)
);
