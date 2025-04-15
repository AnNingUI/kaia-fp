type AsyncOrSync<T> = T | Promise<T>;
type MatchHandler<T, R> = (val: T) => AsyncOrSync<R>;
type Condition<T> = (val: unknown) => val is T;

interface MatcherManager<Input, Output> {
	cases: Array<[Condition<any>, MatchHandler<any, Output>]>;
	fallbackHandler: MatchHandler<Input, Output> | null;
	with<T>(
		cond: Condition<T>,
		handler: MatchHandler<T, Output>
	): MatcherManager<Input, Output>;
	otherwise(
		handler: MatchHandler<Input, Output>
	): MatcherManager<Input, Output>;
	run(value: Input): Promise<Output>;
}

function createMatcherManager<Input, Output>(): MatcherManager<Input, Output> {
	let cases: Array<[Condition<any>, MatchHandler<any, Output>]> = [];
	let fallbackHandler: MatchHandler<Input, Output> | null = null;

	const runner = async (value: Input): Promise<Output> => {
		for (const [check, handler] of cases) {
			if (check(value)) return handler(value);
		}
		if (fallbackHandler) return fallbackHandler(value);
		throw new Error("No match found");
	};

	const api: MatcherManager<Input, Output> = {
		cases,
		fallbackHandler,
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

// 默认导出（兼容原有代码）
export function match<Input, Output>() {
	const manager = createMatcherManager<Input, Output>();
	return manager;
}

export function matchSync<Input, Output>() {
	const manager = createMatcherManager<Input, Output>();
	const runner = (value: Input): Output => {
		for (const [check, handler] of manager.cases) {
			if (check(value)) return handler(value) as Output;
		}
		if (manager.fallbackHandler)
			return manager.fallbackHandler(value) as Output;
		throw new Error("No match found");
	};

	return { ...manager, run: runner };
}

// 允许开发者自定义独立上下文（沙箱模式）
export { createMatcherManager };
