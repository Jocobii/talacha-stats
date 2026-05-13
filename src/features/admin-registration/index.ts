/**
 * features/admin-registration — Exportaciones públicas
 *
 * Solo se exporta lo que necesitan las capas superiores (API routes, pages).
 * Los helpers internos (hashCurp) no se exportan — son detalles de implementación.
 */

export { default as RegistrationForm } from "./ui/RegistrationForm";

export { lookupByCurp } from "./lookup";
export type { LookupInput, LookupResult, LookupSuccess, LookupError } from "./lookup";

export { registerPlayer, RegisterPlayerInputSchema } from "./register";
export type {
	RegisterPlayerInput,
	RegisterResult,
	RegisterSuccess,
	RegisterError,
} from "./register";
