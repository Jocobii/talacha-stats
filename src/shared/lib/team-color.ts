/**
 * shared/lib/team-color.ts
 *
 * Utilidades para asignar colores a equipos.
 *
 * Uso principal: fallback cuando un equipo no tiene color guardado en DB.
 * El color generado es DETERMINÍSTICO — el mismo teamId siempre produce
 * el mismo color, consistente entre sesiones y dispositivos.
 */

/**
 * 64 colores visualmente distintos, distribuidos en todo el espectro.
 * Con 64 opciones y un hash bien distribuido, la probabilidad de colisión
 * en una liga de 20 equipos es < 4% (paradoja del cumpleaños).
 */
export const TEAM_COLOR_PALETTE: readonly string[] = [
	// Rojos
	"#E53935",
	"#C62828",
	"#FF5252",
	"#FF1744",
	"#D50000",
	// Rosas / Fucsia
	"#D81B60",
	"#F06292",
	"#F50057",
	"#AD1457",
	"#FF4081",
	// Morados
	"#8E24AA",
	"#6A1B9A",
	"#AB47BC",
	"#CE93D8",
	"#7B1FA2",
	// Violetas / Índigo
	"#5E35B1",
	"#3949AB",
	"#7C4DFF",
	"#651FFF",
	"#4527A0",
	// Azules
	"#1E88E5",
	"#1565C0",
	"#42A5F5",
	"#2979FF",
	"#0D47A1",
	// Azul cian
	"#00ACC1",
	"#00838F",
	"#26C6DA",
	"#00B8D4",
	"#006064",
	// Verdes azulados / Teal
	"#00897B",
	"#004D40",
	"#26A69A",
	"#1DE9B6",
	"#00BFA5",
	// Verdes
	"#43A047",
	"#2E7D32",
	"#66BB6A",
	"#00C853",
	"#1B5E20",
	// Verde lima
	"#7CB342",
	"#558B2F",
	"#9CCC65",
	"#64DD17",
	"#33691E",
	// Amarillos / Ámbar
	"#FFA726",
	"#E65100",
	"#FFB300",
	"#FF6F00",
	"#FF8F00",
	// Naranjas
	"#FB8C00",
	"#BF360C",
	"#FF7043",
	"#DD2C00",
	"#F4511E",
	// Cafés / Tierra
	"#6D4C41",
	"#4E342E",
	"#8D6E63",
	"#3E2723",
	"#795548",
	// Grises azulados
	"#546E7A",
	"#37474F",
	"#78909C",
	"#263238",
	"#607D8B",
] as const;

/**
 * Genera un índice estable a partir de una cadena usando djb2.
 * Retorna siempre un valor en [0, palette.length).
 */
function hashStringToIndex(str: string, paletteSize: number): number {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 33) ^ str.charCodeAt(i);
		hash = hash >>> 0; // mantiene 32 bits sin signo
	}
	return hash % paletteSize;
}

/**
 * Devuelve un color hex determinístico para un teamId dado.
 * Si el equipo tiene color en DB, úsalo directamente en lugar de llamar esto.
 *
 * @example
 * const bg = team.color ?? teamColorFromId(team.id);
 */
export function teamColorFromId(teamId: string): string {
	const idx = hashStringToIndex(teamId, TEAM_COLOR_PALETTE.length);
	return TEAM_COLOR_PALETTE[idx];
}
