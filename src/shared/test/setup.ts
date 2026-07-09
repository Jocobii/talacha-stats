/**
 * shared/test/setup.ts
 *
 * Setup global de Vitest (referenciado en vitest.config.ts `test.setupFiles`).
 * Registra los matchers de @testing-library/jest-dom (toBeDisabled,
 * toBeEnabled, toBeInTheDocument, etc.) en `expect` — sin esto, cualquier
 * test que los use falla con "Invalid Chai property: toBeDisabled".
 */

import "@testing-library/jest-dom/vitest";
