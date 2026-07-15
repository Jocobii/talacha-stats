/**
 * shared/test/setup.ts
 *
 * Setup global de Vitest (referenciado en vitest.config.ts `test.setupFiles`).
 * Registra los matchers de @testing-library/jest-dom (toBeDisabled,
 * toBeEnabled, toBeInTheDocument, etc.) en `expect` — sin esto, cualquier
 * test que los use falla con "Invalid Chai property: toBeDisabled".
 *
 * @testing-library/react hace auto-cleanup entre tests registrando un
 * `afterEach(cleanup)` — pero solo si `afterEach` existe como global, y este
 * proyecto no usa `test.globals: true` en vitest.config.ts. Sin este cleanup
 * explícito, cada `render()` deja su DOM montado y se acumula entre tests del
 * mismo archivo (ej. varios botones con role="combobox" en el mismo body).
 */

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
	cleanup();
});
