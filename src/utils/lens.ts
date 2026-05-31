export type Lens<S, A> = {
	get: (s: S) => A;
	set: (a: A, s: S) => S;
};

export function lens<S, A>(
	get: (s: S) => A,
	set: (a: A, s: S) => S
): Lens<S, A> {
	return { get, set };
}

export function over<S, A>(l: Lens<S, A>, f: (a: A) => A, s: S): S {
	return l.set(f(l.get(s)), s);
}

export function compose<S, A, B>(outer: Lens<S, A>, inner: Lens<A, B>): Lens<S, B> {
	return {
		get: (s) => inner.get(outer.get(s)),
		set: (b, s) => outer.set(inner.set(b, outer.get(s)), s),
	};
}

export type Zipper<A> = {
	left: A[];
	focus: A;
	right: A[];
};

export function fromArray<A>(arr: A[]): Zipper<A> | null {
	if (arr.length === 0) return null;
	return { left: [], focus: arr[0], right: arr.slice(1) };
}

export function moveLeft<A>(z: Zipper<A>): Zipper<A> | null {
	if (z.left.length === 0) return null;
	const newLeft = [...z.left];
	const newFocus = newLeft.pop()!;
	return {
		left: newLeft,
		focus: newFocus,
		right: [z.focus, ...z.right],
	};
}

export function moveRight<A>(z: Zipper<A>): Zipper<A> | null {
	if (z.right.length === 0) return null;
	const [newFocus, ...newRight] = z.right;
	return {
		left: [...z.left, z.focus],
		focus: newFocus,
		right: newRight,
	};
}
