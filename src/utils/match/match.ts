// match.ts
type AsyncOrSync<T> = T | Promise<T>;
type MatchHandler<T, R> = (val: T) => AsyncOrSync<R>;
type Condition<T> = (val: unknown) => val is T;

export function match<Input, Output>() {
	const cases: Array<[Condition<any>, MatchHandler<any, Output>]> = [];
	let fallbackHandler: MatchHandler<Input, Output> | null = null;

	const runner = async (value: Input): Promise<Output> => {
		for (const [check, handler] of cases) {
			if (check(value)) return handler(value);
		}
		if (fallbackHandler) return fallbackHandler(value);
		throw new Error("No match found");
	};

	const api = {
		with<T>(cond: Condition<T>, handler: MatchHandler<T, Output>) {
			cases.push([cond, handler]);
			return api;
		},
		otherwise(handler: MatchHandler<Input, Output>) {
			fallbackHandler = handler;
			return api;
		},
		run: runner,
	};

	return api;
}
