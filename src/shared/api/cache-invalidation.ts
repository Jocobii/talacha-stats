/**
 * shared/api/cache-invalidation.ts
 *
 * Registro central de invalidación (docs/REACT-QUERY-CACHE-STANDARD.md §4).
 * Única fuente de verdad de "qué caduca cada mutación de dominio" — los hooks
 * de mutación llaman a estas funciones en `onSuccess`, nunca arman
 * `invalidateQueries` sueltos a mano. Cada efecto tiene su test
 * (`cache-invalidation.test.ts`), así que un cambio en qué invalida una
 * mutación queda protegido, no vive solo en un comentario.
 *
 * Mapa de invalidación (mantener en sync con esta tabla y con la tabla
 * completa del doc §4.1; hoy solo cubre el dominio `teams`, migrado en esta
 * sesión — el resto de mutaciones sigue con `invalidateQueries` suelto,
 * pendiente de su propio slice):
 *
 *   | Mutación                | Efecto              | Invalida                                    |
 *   | ------------------------ | -------------------- | -------------------------------------------- |
 *   | transferir jugador       | rosterTransferred    | teams.roster(ambos) + teams.list(leagueId)   |
 *   | dar de baja / editar miembro | rosterMemberChanged | teams.roster(teamId)                     |
 *   | crear equipo             | teamCreated          | teams.list(leagueId)                         |
 *   | editar equipo             | teamUpdated          | teams.list(leagueId) + teams.detail(teamId) |
 *   | crear/toggle/borrar activación de skin | skinChanged | skins.activations() + skins.active() |
 *   | registrar/escalar sanción (vista global) | suspensionChangedGlobal | suspensions.admin() + suspensions.byLeague(leagueId) |
 *   | registrar/escalar sanción (scoped a liga) | suspensionChanged | suspensions.byLeague(leagueId) |
 */

import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

export const invalidate = {
	// Transferir un jugador de un equipo a otro. `teams.list(leagueId)` se
	// invalida también porque el selector de transferencia depende de ese
	// listado (aunque hoy `TeamOption` no incluya conteos derivados del roster).
	rosterTransferred: (
		qc: QueryClient,
		p: { fromTeamId: string; toTeamId: string; leagueId: string },
	) => {
		qc.invalidateQueries({ queryKey: queryKeys.teams.roster(p.fromTeamId) });
		qc.invalidateQueries({ queryKey: queryKeys.teams.roster(p.toTeamId) });
		qc.invalidateQueries({ queryKey: queryKeys.teams.list(p.leagueId) });
	},

	// Dar de baja o editar un miembro dentro del mismo equipo (sin cambiar de
	// equipo) — solo su propio roster cambia.
	rosterMemberChanged: (qc: QueryClient, p: { teamId: string }) => {
		qc.invalidateQueries({ queryKey: queryKeys.teams.roster(p.teamId) });
	},

	// Alta de equipo nuevo en una liga.
	teamCreated: (qc: QueryClient, p: { leagueId: string }) => {
		qc.invalidateQueries({ queryKey: queryKeys.teams.list(p.leagueId) });
	},

	// Edición de equipo (nombre, color).
	teamUpdated: (qc: QueryClient, p: { leagueId: string; teamId: string }) => {
		qc.invalidateQueries({ queryKey: queryKeys.teams.list(p.leagueId) });
		qc.invalidateQueries({ queryKey: queryKeys.teams.detail(p.teamId) });
	},

	// Crear, encender/apagar o borrar una activación de tema (tournament-skin).
	// Encender/apagar puede cambiar el skin público al instante.
	skinChanged: (qc: QueryClient) => {
		qc.invalidateQueries({ queryKey: queryKeys.skins.activations() });
		qc.invalidateQueries({ queryKey: queryKeys.skins.active() });
	},

	// Registrar/escalar/levantar sanción desde la vista GLOBAL (B7b) — la
	// vista admin y el tab de la liga dueña quedan consistentes.
	suspensionChangedGlobal: (qc: QueryClient, p: { leagueId: string }) => {
		qc.invalidateQueries({ queryKey: queryKeys.suspensions.admin() });
		qc.invalidateQueries({ queryKey: queryKeys.suspensions.byLeague(p.leagueId) });
	},

	// Registrar/escalar/levantar sanción desde el tab de UNA liga — a
	// propósito NO toca la vista global (B7).
	suspensionChanged: (qc: QueryClient, p: { leagueId: string }) => {
		qc.invalidateQueries({ queryKey: queryKeys.suspensions.byLeague(p.leagueId) });
	},
} as const;
