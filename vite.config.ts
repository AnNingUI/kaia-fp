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
			external: (id) => !id.startsWith(".") && !path.isAbsolute(id),
			output: {
				globals: {}, // 全局变量名称映射
			},
		},
	},
	plugins: [
		alias({
			entries: [
				{
					find: "kaia-fs/core",
					replacement: path.resolve(__dirname, "src/core"),
				},
				{
					find: "kaia-fs/utils",
					replacement: path.resolve(__dirname, "src/utils"),
				},
				{
					find: "kaia-fs/instances",
					replacement: path.resolve(__dirname, "src/instances"),
				},
			],
		}),
		typescript({
			tsconfig: path.resolve(__dirname, "./tsconfig.build.json"),
			declaration: true,
			declarationDir: path.resolve(__dirname, "dist/types"),
		}),
	],
});
