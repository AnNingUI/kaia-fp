/** A type-narrowing predicate (type guard). */
export type Refinement<A, B extends A> = (value: A) => value is B;

/** Utility type: asserts exhaustive switch/case by constraining to `never`. */
export type AssertNever<T extends never> = T;
