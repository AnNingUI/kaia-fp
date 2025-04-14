// builder.ts

import { Predicate } from "./is";

type ShapeRegistry = Record<string, Predicate<any>>;

const registry: ShapeRegistry = {};

export function defineShape<T>(name: string, shape: Predicate<T>) {
	registry[name] = shape;
	return shape;
}

export function getShape<T>(name: string): Predicate<T> | undefined {
	return registry[name] as Predicate<T>;
}
