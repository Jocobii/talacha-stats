import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "node",
		setupFiles: ["./src/shared/test/setup.ts"],
		include: ["src/**/*.test.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			include: ["src/features/**/*.{ts,tsx}"],
			exclude: ["src/features/**/__tests__/**", "src/features/**/index.ts"],
		},
	},
});
