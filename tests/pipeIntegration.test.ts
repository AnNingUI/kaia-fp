import { describe, it, expect } from "vitest";
import { pipe } from "../src/utils/pipe/pipe";
import { tap, once, clamp, between, prop, pick, omit } from "../src/utils/combinators";
import { groupBy, partition, chunk, uniqBy, flatMapArr } from "../src/utils/collection";

describe("combinators combined in a single pipe", () => {
	it("full pipeline — all point-free", () => {
		const log: string[] = [];

		interface User {
			name: string;
			age: number;
			email: string;
			password: string;
			score: number;
		}

		const raw: User = {
			name: "alice",
			age: 200,
			email: "a@b.com",
			password: "s3cret",
			score: 85,
		};

		// 全链 point-free：clamp/between/pick/omit 全部直接组合
		const pipeline = pipe(
			(u: User) => tap((u: User) => log.push(`input: ${u.name}`))(u),
			(u) => ({ ...u, age: clamp(0, 120, u.age), score: clamp(0, 100, u.score) }),
			(u) => between(0, 120, u.age) ? u : { ...u, age: 0 },
			omit("password", "email"),
			pick("name", "age", "score"),
			tap((u) => log.push(`output: ${JSON.stringify(u)}`)),
		);

		const result = pipeline(raw);

		expect(result).toEqual({ name: "alice", age: 120, score: 85 });
		expect(result).not.toHaveProperty("email");
		expect(result).not.toHaveProperty("password");
	});

	it("curried clamp + between in pipe", () => {
		const normalize = pipe(
			clamp(0, 100),
			between(0, 50),
		);

		expect(normalize(150)).toBe(false);  // clamp(0,100,150)=100, between(0,50,100)=false
		expect(normalize(30)).toBe(true);     // clamp(0,100,30)=30, between(0,50,30)=true
		expect(normalize(-5)).toBe(true);     // clamp(0,100,-5)=0, between(0,50,0)=true
	});

	it("curried collection functions in pipe", () => {
		interface Item {
			type: string;
			value: number;
		}

		const data: Item[] = [
			{ type: "a", value: 1 },
			{ type: "b", value: 2 },
			{ type: "a", value: 3 },
			{ type: "c", value: 4 },
			{ type: "b", value: 5 },
		];

		// groupBy point-free
		const grouped = pipe(
			groupBy((x: Item) => x.type),
		)(data);
		expect(Object.keys(grouped)).toEqual(["a", "b", "c"]);
		expect(grouped["a"]).toHaveLength(2);

		// partition point-free
		const [big, small] = pipe(
			partition((x: Item) => x.value > 2),
		)(data);
		expect(big).toHaveLength(3);
		expect(small).toHaveLength(2);

		// chunk point-free
		const chunked = pipe(
			chunk(2),
		)(data);
		expect(chunked).toHaveLength(3);
		expect(chunked[0]).toHaveLength(2);

		// uniqBy point-free
		const deduped = pipe(
			uniqBy((x: Item) => x.type),
		)(data);
		expect(deduped).toHaveLength(3);

		// flatMapArr point-free
		const expanded = pipe(
			flatMapArr((x: Item) => [x.value, x.value * 10]),
		)(data);
		expect(expanded).toEqual([1, 10, 2, 20, 3, 30, 4, 40, 5, 50]);
	});

	it("curried collection functions combined in a single pipe", () => {
		interface User {
			name: string;
			role: string;
			score: number;
		}

		const users: User[] = [
			{ name: "alice", role: "admin", score: 90 },
			{ name: "bob", role: "user", score: 45 },
			{ name: "charlie", role: "admin", score: 72 },
			{ name: "dave", role: "user", score: 88 },
		];

		// 一条 pipe：过滤 → 去重 → 分组 → 分块
		const result = pipe(
			(arr: User[]) => arr.filter((u) => u.score > 50),
			uniqBy((u) => u.role),
			groupBy((u) => u.role),
		)(users);

		expect(result["admin"]).toHaveLength(1);
		expect(result["user"]).toHaveLength(1);
	});

	it("pick/omit direct usage (non-curried)", () => {
		const user = { name: "alice", age: 30, email: "a@b.com", password: "s" };
		expect(pick(user, "name", "age")).toEqual({ name: "alice", age: 30 });
		expect(omit(user, "password")).toEqual({ name: "alice", age: 30, email: "a@b.com" });
	});

	it("pick/omit curried usage", () => {
		const user = { name: "alice", age: 30, email: "a@b.com", password: "s" };
		const getName = pick("name");
		const hidePassword = omit("password");
		expect(getName(user)).toEqual({ name: "alice" });
		expect(hidePassword(user)).toEqual({ name: "alice", age: 30, email: "a@b.com" });
	});

	it("clamp/between direct usage (non-curried)", () => {
		expect(clamp(0, 100, 150)).toBe(100);
		expect(clamp(0, 100, -5)).toBe(0);
		expect(clamp(0, 100, 50)).toBe(50);
		expect(between(0, 10, 5)).toBe(true);
		expect(between(0, 10, 15)).toBe(false);
	});

	it("clamp/between curried usage", () => {
		const clamp0to100 = clamp(0, 100);
		const isInRange = between(0, 100);
		expect(clamp0to100(150)).toBe(100);
		expect(clamp0to100(-5)).toBe(0);
		expect(isInRange(50)).toBe(true);
		expect(isInRange(150)).toBe(false);
	});

	it("omit + pick + prop in object transformation pipe", () => {
		const log: string[] = [];
		const getName = prop("name");

		interface Record {
			id: number;
			name: string;
			email: string;
			meta: { role: string };
		}

		const raw: Record[] = [
			{ id: 1, name: "alice", email: "a@b.com", meta: { role: "admin" } },
			{ id: 2, name: "bob", email: "b@c.com", meta: { role: "user" } },
		];

		const pipeline = pipe(
			(arr: Record[]) =>
				arr.map(tap((r) => log.push(`processing ${getName(r)}`))),
			(arr) =>
				arr.map(pick("id", "name")),
			tap((arr) => log.push(`result count: ${arr.length}`)),
		);

		const result = pipeline(raw);

		expect(result).toEqual([
			{ id: 1, name: "alice" },
			{ id: 2, name: "bob" },
		]);
		expect(log).toEqual([
			"processing alice",
			"processing bob",
			"result count: 2",
		]);
	});
});
