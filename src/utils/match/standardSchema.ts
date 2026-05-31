import type { Predicate } from "./is";
import type { StandardSchemaV1 } from "./standardSchemaTypes";

export interface SchemaOptions {
	/** Custom message factory. Receives the invalid value and the path (empty for root). */
	messageFactory?: (value: unknown, path: ReadonlyArray<PropertyKey>) => string;
}

/**
 * Wrap a kaia-fp `Predicate<T>` as a Standard Schema v1 object.
 *
 * - Plain predicates → simple pass/fail.
 * - Shape predicates (created via `is.shape()`) → per-field path-aware validation
 *   with recursive nested shape support.
 */
export function schema<T>(
	predicate: Predicate<T>,
	options?: SchemaOptions,
): StandardSchemaV1<unknown, T> {
	const shape: Record<string, Predicate<any>> | undefined =
		(predicate as any)._shape;

	return {
		"~standard": {
			version: 1,
			vendor: "kaia-fp",
			validate(value: unknown) {
				if (shape && isRecord(value)) {
					const issues = validateShape(shape, value, [], options);
					return issues.length > 0 ? { issues } : { value: value as T };
				}

				if (shape) {
					// shape predicate but input is not a record
					const msg = buildMessage(options, value, []);
					return { issues: [{ message: msg }] };
				}

				return predicate(value)
					? { value: value as T }
					: { issues: [{ message: buildMessage(options, value, []) }] };
			},
		},
	};
}

function validateShape(
	shape: Record<string, Predicate<any>>,
	value: Record<string, unknown>,
	basePath: ReadonlyArray<PropertyKey>,
	options: SchemaOptions | undefined,
): StandardSchemaV1.Issue[] {
	const issues: StandardSchemaV1.Issue[] = [];

	for (const key of Object.keys(shape)) {
		const fieldPred = shape[key];
		const fieldVal = value[key];
		const fieldPath = [...basePath, key];
		const nestedShape: Record<string, Predicate<any>> | undefined =
			(fieldPred as any)._shape;

		if (nestedShape && isRecord(fieldVal)) {
			// recurse into nested shape
			issues.push(...validateShape(nestedShape, fieldVal, fieldPath, options));
		} else if (!fieldPred(fieldVal)) {
			issues.push({
				message: buildMessage(options, fieldVal, fieldPath),
				path: fieldPath.map((k) => ({ key: k })),
			});
		}
	}

	return issues;
}

function buildMessage(
	options: SchemaOptions | undefined,
	value: unknown,
	path: ReadonlyArray<PropertyKey>,
): string {
	if (options?.messageFactory) {
		return options.messageFactory(value, path);
	}
	return path.length > 0
		? `Invalid value for '${path.join(".")}'`
		: "Invalid value";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
