/**
 * entities/league/model.ts
 * Tipos del dominio Liga. El tipo de DB (`League`) se infiere con `$inferSelect`
 * (§4.1) y se re-exporta desde @/db — fuente única del contrato (§7.4). `app` y
 * `features` lo importan; nunca se re-declara el shape a mano en el callsite.
 */

import type { League, NewLeague } from "@/db";

export type { League, NewLeague };
