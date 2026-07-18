/**
 * features/player-directory/types.ts
 * ViewModel del directorio público de jugadores (§19).
 *
 * Sin `alias`: el directorio ahora lee global_players (V2), que no tiene
 * columna de apodo (solo existía en la tabla V1 `players`).
 */

export type PlayerDirectoryView = {
	id: string;
	displayName: string;
};
