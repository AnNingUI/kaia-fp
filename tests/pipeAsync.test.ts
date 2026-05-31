import { describe, it, expect } from "vitest";
import { pipeAsync } from "../src/utils/pipe/pipe";

interface Post {
	userId: number;
	id: number;
	title: string;
	body: string;
}

interface Comment {
	postId: number;
	id: number;
	name: string;
	email: string;
	body: string;
}

describe("pipeAsync 真实 API 测试", () => {
	const API = "https://jsonplaceholder.typicode.com";

	it("fetch → 解析 → 提取字段", async () => {
		const pipeline = pipeAsync(
			async (url: string) => fetch(url),
			async (res: Response) => res.json() as Promise<Post>,
			(post: Post) => ({ id: post.id, title: post.title }),
		);

		const result = await pipeline(`${API}/posts/1`);
		console.log(result);
		expect(result.id).toBe(1);
		expect(typeof result.title).toBe("string");
		expect(result.title.length).toBeGreaterThan(0);
	});

	it("fetch → 解析数组 → 过滤 → 计数", async () => {
		const pipeline = pipeAsync(
			async (url: string) => fetch(url),
			async (res: Response) => res.json() as Promise<Post[]>,
			(posts: Post[]) => posts.filter((p) => p.userId === 1),
			(filtered: Post[]) => filtered.length,
		);

		const count = await pipeline(`${API}/posts`);
		expect(count).toBe(10);
	});

	it("extends 逐步构建数据处理链", async () => {
		const base = pipeAsync(
			async (url: string) => fetch(url),
			async (res: Response) => res.json() as Promise<Post[]>,
		);

		const withFilter = base.extends(
			(posts: Post[]) => posts.slice(0, 3),
		);

		const withMapping = withFilter.extends(
			(posts: Post[]) => posts.map((p) => ({ id: p.id, title: p.title.slice(0, 20) })),
		);

		const result = await withMapping(`${API}/posts`);
		expect(result).toHaveLength(3);
		expect(result[0]).toHaveProperty("id");
		expect(result[0]).toHaveProperty("title");
		expect(result[0].title.length).toBeLessThanOrEqual(20);
	});

	it("链式 extends — 完整管线", async () => {
		const pipeline = pipeAsync(
			async (id: number) => fetch(`${API}/posts/${id}`),
		)
			.extends(async (res: Response) => res.json() as Promise<Post>)
			.extends((post: Post) => post.title.toUpperCase())
			.extends((title: string) => `[POST] ${title}`)
			.extends(async (label: string) => {
				// 模拟异步副作用
				return { label, timestamp: Date.now() };
			})
			.extends((data: { label: string; timestamp: number }) => data.label);

		const result = await pipeline(1);

		expect(result).toMatch(/^\[POST\] /);
		expect(result.length).toBeGreaterThan(6);
	});

	it("多 API 串联 — post → 用户的帖子列表", async () => {
		// 先拿一个 post 的 userId，再拿该用户所有帖子
		const pipeline = pipeAsync(
			async (postId: number) => fetch(`${API}/posts/${postId}`),
			async (res: Response) => res.json() as Promise<Post>,
			async (post: Post) => {
				const res = await fetch(`${API}/users/${post.userId}`);
				const user = await res.json() as { id: number; name: string; email: string };
				return { user, postTitle: post.title };
			},
			(data: { user: { id: number; name: string; email: string }; postTitle: string }) => ({
				author: data.user.name,
				email: data.user.email,
				firstPost: data.postTitle,
			}),
		);

		const result = await pipeline(1);
		expect(result.author).toBeTruthy();
		expect(result.email).toContain("@");
		expect(result.firstPost).toBeTruthy();
	});

	it("错误传播 — fetch 失败时 reject", async () => {
		const pipeline = pipeAsync(
			async (url: string) => fetch(url),
			async (res: Response) => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				return res.json();
			},
		);

		await expect(pipeline(`${API}/posts/99999`)).rejects.toThrow("HTTP 404");
	});

	it("并行 fetch + 合并", async () => {
		const pipeline = pipeAsync(
			async (ids: number[]) => {
				const results = await Promise.all(
					ids.map((id) => fetch(`${API}/posts/${id}`).then((r) => r.json() as Promise<Post>)),
				);
				return results;
			},
			(posts: Post[]) => posts.map((p) => p.title),
			(titles: string[]) => titles.join(" | "),
		);

		const result = await pipeline([1, 2, 3]);
		const parts = result.split(" | ");
		expect(parts).toHaveLength(3);
		parts.forEach((p) => expect(p.length).toBeGreaterThan(0));
	});
});
