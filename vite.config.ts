import alias from "@rollup/plugin-alias";
import typescript from "@rollup/plugin-typescript";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, "src/index.ts"),
			name: "FPUtils",
			fileName: (format) => `kaia-fp.${format}.js`,
		},
		rollupOptions: {
			external: [], // 需要外部化的依赖
			output: {
				globals: {}, // 全局变量名称映射
			},
		},
	},
	plugins: [
		alias({
			entries: [
				{ find: "@core", replacement: path.resolve(__dirname, "src/core") },
				{ find: "@utils", replacement: path.resolve(__dirname, "src/utils") },
				{
					find: "@instances",
					replacement: path.resolve(__dirname, "src/instances"),
				},
			],
		}),
		typescript({
			tsconfig: "./tsconfig.json",
			declaration: true,
			declarationDir: "dist/types",
		}),
	],
});
