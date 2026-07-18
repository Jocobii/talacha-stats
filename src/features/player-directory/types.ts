/**
 * features/player-directory/types.ts
 * ViewModel del directorio público de jugadores (§19).
 */

export type PlayerDirectoryView = {
	id: string;
	displayName: string;
	alias: string | null;
};
