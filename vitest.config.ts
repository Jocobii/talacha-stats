import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		// Entorno por defecto = node (rápido) para tests puros: mappers, utils,
		// lógica de servicio. Los tests que tocan DOM (hooks con renderHook,
		// componentes con RTL) declaran su entorno por archivo con el docblock:
		//   // @vitest-environment jsdom
		environment: "node",
		// Colecta tests co-localizados (`map-x.test.ts`, `use-x.test.tsx`) además
		// de los de `__tests__/`. Co-localizar es la convención del proyecto (§20).
		include: ["src/**/*.test.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			include: ["src/features/**/*.{ts,tsx}"],
			exclude: ["src/features/**/__tests__/**", "src/features/**/index.ts"],
		},
	},
});
