/**
 * ARCHIVO OBSOLETO — no lo uses. `ANNUAL_PASS_DURATION_YEARS` vive en
 * entities/player-credential/lib/issue-credential.ts porque también la usa
 * features/admin-registration/register.ts (emisión inline). Ningún archivo
 * importa este módulo; el agente no pudo borrarlo (mount de solo-lectura
 * para deletes). Bórralo manualmente:
 * `rm src/features/player-credential/constants.ts`.
 */
export { ANNUAL_PASS_DURATION_YEARS } from "@/entities/player-credential/lib/issue-credential";
