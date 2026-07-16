/**
 * features/admin-registration/lib/assign-credential.ts
 *
 * ARCHIVO OBSOLETO — no lo uses. La implementación real vive en
 * entities/player/lib/assign-credential.ts (varios features crean
 * league_members, no le corresponde a uno solo). Ningún archivo importa
 * este módulo; el agente no pudo borrarlo (mount de solo-lectura para
 * deletes). Bórralo manualmente: `rm src/features/admin-registration/lib/assign-credential.ts`.
 */
export { assignNextCredential } from "@/entities/player/lib/assign-credential";
