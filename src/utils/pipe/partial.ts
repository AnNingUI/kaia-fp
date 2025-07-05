import { _, type Placeholder } from "./curry";

/**
 * Creates a partially applied function.
 *
 * @param fn The function to partially apply.
 * @param args Initial arguments, where `_` can be used as a placeholder.
 * @returns A new function that, when called, will fill in the placeholders
 * and then call the original function with all arguments.
 */
export function partial<T extends (...args: any[]) => any>(
	fn: T,
	...args: Array<Placeholder | Exclude<Parameters<T>[number], Placeholder>>
): (...args: any[]) => ReturnType<T> {
	return function (
		this: ThisParameterType<T>,
		...innerArgs: any[]
	): ReturnType<T> {
		const finalArgs: any[] = [];
		let innerArgsPosition = 0;

		for (let i = 0; i < args.length; i++) {
			if (args[i] === _) {
				finalArgs.push(innerArgs[innerArgsPosition++]);
			} else {
				finalArgs.push(args[i]);
			}
		}

		// Add any remaining arguments from the inner function call
		while (innerArgsPosition < innerArgs.length) {
			finalArgs.push(innerArgs[innerArgsPosition++]);
		}

		return fn.apply(this, finalArgs) as ReturnType<T>;
	};
}