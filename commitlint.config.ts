import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
	extends: ["@commitlint/config-conventional"],
	rules: {
		// Tipos permitidos
		"type-enum": [
			2,
			"always",
			[
				"feat", // nueva funcionalidad
				"fix", // corrección de bug
				"chore", // tareas de mantenimiento (deps, config, etc.)
				"docs", // solo documentación
				"refactor", // refactor sin cambio de comportamiento
				"test", // agregar o corregir pruebas
				"style", // formato, espacios, puntos y coma (sin lógica)
				"perf", // mejora de rendimiento
				"ci", // cambios en CI/CD
				"revert", // revertir un commit anterior
			],
		],
		// El subject no puede terminar en punto
		"subject-full-stop": [2, "never", "."],
		// El subject debe estar en minúsculas
		"subject-case": [2, "always", "lower-case"],
		// Longitud máxima del header (tipo + scope + subject)
		"header-max-length": [2, "always", 100],
	},
};

export default config;
