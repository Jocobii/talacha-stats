/**
 * src/db/simulator/smoke-ttfb.ts
 *
 * Organization Simulator — Épica D3 (docs/ORGANIZATION-SIMULATOR.md), parte 2:
 * script de humo que golpea rutas públicas y mide TTFB, para comparar tiers
 * (S→XL) contra la misma app corriendo (`pnpm dev` o un deploy).
 *
 * No corre datos ni toca la DB — asume que ya corriste `pnpm db:simulate`
 * para el tier que quieres medir, y que la app está sirviendo esos datos.
 *
 * Uso:
 *   pnpm db:smoke -- --base-url http://localhost:3000 --org <slug> --league <leagueId> --city Tijuana
 *
 * Rutas medidas:
 *   /es/ranking?scope=city&city=<city>
 *   /es/ranking?scope=global
 *   /es/matchday?city=<city>
 *   /es/org/<orgSlug>
 *   /es/org/<orgSlug>/<leagueSlug>   (si se resolvió el slug de liga)
 *   /es/player/<playerId>            (V1 legacy — sigue midiéndose "as-is",
 *                                      no verá datos del simulador; ver nota
 *                                      en measure-queries.ts)
 *
 * Nota: --player-id es opcional; sin él se omite esa ruta.
 */

function readFlag(name: string): string | undefined {
	const args = process.argv.slice(2);
	const idx = args.indexOf(`--${name}`);
	if (idx === -1 || idx === args.length - 1) return undefined;
	return args[idx + 1];
}

const baseUrl = (readFlag("base-url") ?? "http://localhost:3000").replace(/\/$/, "");
const city = readFlag("city") ?? "Tijuana";
const orgSlug = readFlag("org");
const leagueSlug = readFlag("league-slug");
const playerId = readFlag("player-id");
const RUNS_PER_ROUTE = Number(readFlag("runs") ?? "3");

type RouteResult = { route: string; runs: number[]; status: number | "error" };

async function measureRoute(path: string): Promise<RouteResult> {
	const url = `${baseUrl}${path}`;
	const runs: number[] = [];
	let lastStatus: number | "error" = "error";

	for (let i = 0; i < RUNS_PER_ROUTE; i++) {
		const start = performance.now();
		try {
			const res = await fetch(url, { cache: "no-store" });
			// Consumir el body para que el timing incluya la respuesta completa,
			// no solo los headers — TTFB "efectivo" desde la perspectiva del cliente.
			await res.text();
			const elapsed = performance.now() - start;
			runs.push(elapsed);
			lastStatus = res.status;
		} catch (err) {
			console.error(`  ❌  ${path} (run ${i + 1}): ${err instanceof Error ? err.message : err}`);
		}
	}

	return { route: path, runs, status: lastStatus };
}

function summarize(runs: number[]): string {
	if (runs.length === 0) return "sin datos (todas las corridas fallaron)";
	const sorted = [...runs].sort((a, b) => a - b);
	const avg = runs.reduce((s, n) => s + n, 0) / runs.length;
	const p50 = sorted[Math.floor(sorted.length / 2)];
	const max = sorted[sorted.length - 1];
	return `avg=${avg.toFixed(0)}ms  p50=${p50.toFixed(0)}ms  max=${max.toFixed(0)}ms`;
}

async function run(): Promise<void> {
	console.log("──────────────────────────────────────────");
	console.log("🚦  Organization Simulator — Smoke TTFB (D3)");
	console.log(`📍  ${baseUrl}`);
	console.log(`🏙️   city=${city}  org=${orgSlug ?? "—"}  league=${leagueSlug ?? "—"}`);
	console.log(`🔁  ${RUNS_PER_ROUTE} corridas por ruta`);
	console.log("──────────────────────────────────────────");

	const routes = [
		`/es/ranking?scope=city&city=${encodeURIComponent(city)}`,
		`/es/ranking?scope=global`,
		`/es/matchday?city=${encodeURIComponent(city)}`,
		...(orgSlug ? [`/es/org/${orgSlug}`] : []),
		...(orgSlug && leagueSlug ? [`/es/org/${orgSlug}/${leagueSlug}`] : []),
		...(playerId ? [`/es/player/${playerId}`] : []),
	];

	const results: RouteResult[] = [];
	for (const route of routes) {
		console.log(`\n▶ ${route}`);
		const result = await measureRoute(route);
		results.push(result);
		console.log(`  status=${result.status}  ${summarize(result.runs)}`);
	}

	console.log("\n──────────────────────────────────────────");
	console.log("Resumen:");
	console.log("──────────────────────────────────────────");
	for (const r of results) {
		console.log(`${r.route.padEnd(55)} ${summarize(r.runs)}`);
	}

	if (!orgSlug) {
		console.log(
			"\n💡  Pasa --org <slug> (y --league-slug) para medir también /org/[slug] y la liga.",
		);
	}
	if (!playerId) {
		console.log(
			"💡  Pasa --player-id <id> para medir /player/[id] — ojo: hoy esa ruta sigue en la cadena V1 legacy,",
		);
		console.log("    no verá datos generados por el simulador (ver nota en measure-queries.ts).");
	}
}

run().catch((err) => {
	console.error("❌  smoke-ttfb falló:", err);
	process.exit(1);
});
