import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// 排除仓库内第三方源码 checkout（bun 项目），避免被 vitest 误扫
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/yuku/**",
			"**/rolldown-plugin-dts/**",
		],
	},
});
