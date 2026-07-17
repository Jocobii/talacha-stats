/**
 * features/organization-credential-config/index.ts
 * Exportaciones públicas. config.ts es SOLO server (importa @/db) — no se
 * re-exporta aquí; API routes y páginas server lo importan por ruta directa
 * `@/features/organization-credential-config/config` (mismo patrón que
 * organization-rules).
 */
export { CredencialesTab } from "./ui/CredencialesTab";
export { useOrgCredentialConfig } from "./model/useOrgCredentialConfig";
export { useUpdateOrgCredentialConfig } from "./model/useUpdateOrgCredentialConfig";
