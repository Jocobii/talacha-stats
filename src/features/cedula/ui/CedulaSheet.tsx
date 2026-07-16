"use client";

/**
 * features/cedula/ui/CedulaSheet.tsx
 * Pinta UNA hoja de cédula a partir de un `CedulaSheetVM` (build-cedula-view-model.ts).
 * Puerto directo de `template.html` (diseño ya aprobado, docs/CEDULA-IMPRESA-SPEC.md)
 * a JSX + `<style jsx>` (mismo patrón que AdminShell.tsx). Sin fetching, sin
 * lógica de negocio — solo pintar el view-model.
 */
import type { CSSProperties } from "react";
import type {
	CedulaDensity,
	CedulaRowVM,
	CedulaSheetVM,
	CedulaTeamVM,
} from "../lib/build-cedula-view-model";

/** Altura de renglón y tamaño de fuente por densidad (§3.3 del plan). */
const DENSITY_VARS: Record<CedulaDensity, { rowH: string; nameSize: string }> = {
	normal: { rowH: "8mm", nameSize: "11px" },
	compact: { rowH: "6.5mm", nameSize: "10px" },
	tight: { rowH: "5.5mm", nameSize: "9px" },
};

function TeamTable({ team }: { team: CedulaTeamVM }) {
	return (
		<div className="team">
			<div className="team-head">
				<span className="pill">{team.label === "LOCAL" ? "Local" : "Visita"}</span>
				<span className="name">{team.teamName}</span>
				<span className="score">
					<span className="sb" />
					<span className="sl">Goles</span>
				</span>
			</div>
			<table>
				<colgroup>
					<col className="c-code" />
					<col className="c-name" />
					<col className="c-dor" />
					<col className="c-attend" />
					<col className="c-goals" />
					<col className="c-cards" />
				</colgroup>
				<thead>
					<tr>
						<th className="c-code">#</th>
						<th className="c-name">Jugador</th>
						<th className="c-dor">Dor</th>
						<th className="c-attend">Asist</th>
						<th className="c-goals">Goles</th>
						<th className="c-cards">A&nbsp;·&nbsp;R</th>
					</tr>
				</thead>
				<tbody>
					{team.rows.map((row, i) => (
						<TeamRow key={i} row={row} />
					))}
				</tbody>
			</table>
			<div className="blank-label">
				Últimos renglones: refuerzos / no registrados (anotar a mano)
			</div>
		</div>
	);
}

function TeamRow({ row }: { row: CedulaRowVM }) {
	if (row.kind === "blank") {
		return (
			<tr className="blank">
				<td className="c-code" />
				<td className="c-name" />
				<td className="c-dor" />
				<td className="c-attend">
					<AttendCell />
				</td>
				<td className="c-goals" />
				<td className="c-cards">
					<CardsCell />
				</td>
			</tr>
		);
	}

	if (row.suspended) {
		return (
			<tr className="susp">
				<td className="c-code">{row.credentialCode}</td>
				<td className="c-name">
					<span className="susp-name">{row.fullName}</span>
				</td>
				<td className="c-dor">{row.dorsal}</td>
				<td className="c-attend" />
				<td className="c-goals">
					<span className="blocked">Susp.</span>
				</td>
				<td className="c-cards" />
			</tr>
		);
	}

	return (
		<tr>
			<td className="c-code">{row.credentialCode}</td>
			<td className="c-name">
				<span className="pname">{row.fullName}</span>
			</td>
			<td className="c-dor">{row.dorsal}</td>
			<td className="c-attend">
				<AttendCell />
			</td>
			<td className="c-goals" />
			<td className="c-cards">
				<CardsCell />
			</td>
		</tr>
	);
}

function CardsCell() {
	return (
		<span className="cards-cell">
			<span className="box a" />
			<span className="box r" />
		</span>
	);
}

function AttendCell() {
	return (
		<span className="attend-cell">
			<span className="box att" />
		</span>
	);
}

export function CedulaSheet({ vm }: { vm: CedulaSheetVM }) {
	const { rowH, nameSize } = DENSITY_VARS[vm.density];

	return (
		<div className="sheet" style={{ "--row-h": rowH, "--name-size": nameSize } as CSSProperties}>
			<header className="header">
				<div className="h-left">
					<div className="liga">{vm.leagueName}</div>
					<div className="chips">
						{vm.chips.map((c) => (
							<span className="chip" key={c}>
								{c}
							</span>
						))}
					</div>
				</div>
				<div className="h-title">
					<div className="k">Cédula</div>
					<div className="s">de partido</div>
				</div>
				<div className="h-folio">
					<span className="lbl">Folio</span>
					<span className="val">{vm.folio}</span>
				</div>
			</header>

			<div className="meta">
				<div>
					<span className="lbl">Jornada</span>
					<b>{vm.matchdayLabel}</b>
				</div>
				<div>
					<span className="lbl">Fecha</span>
					<b>{vm.dateLabel}</b>
				</div>
				<div>
					<span className="lbl">Hora</span>
					<b>{vm.timeLabel || "—"}</b>
				</div>
				<div>
					<span className="lbl">Cancha</span>
					<b>{vm.venueLabel || "—"}</b>
				</div>
			</div>

			<section className="teams">
				<TeamTable team={vm.home} />
				<TeamTable team={vm.away} />
			</section>

			<footer className="foot">
				<div className="obs">
					<div className="obs-label">Observaciones</div>
					<div className="obs-line" />
					<div className="obs-line" />
				</div>
				<div className="signs">
					<div className="sign">
						<div className="line" />
						<div className="lb">Capitán — {vm.home.teamName}</div>
						<div className="sub">Local</div>
					</div>
					<div className="sign">
						<div className="line" />
						<div className="lb">Árbitro Central</div>
						<div className="sub">Nombre y firma</div>
					</div>
					<div className="sign">
						<div className="line" />
						<div className="lb">Capitán — {vm.away.teamName}</div>
						<div className="sub">Visita</div>
					</div>
				</div>
				<div className="legend">
					<span className="li">
						<span className="lg-box a" />
						<b>A</b> = Amarilla
					</span>
					<span className="li">
						<span className="lg-box r" />
						<b>R</b> = Roja
					</span>
					<span className="li">
						<span className="lg-susp" />
						<b>NO JUEGA</b> = jugador suspendido, no puede alinear
					</span>
					<span className="li">
						<span className="lg-box att" />
						<b>Asist</b> = asistencia, marcar al llegar
					</span>
					<span className="li">Renglones punteados = jugadores no registrados (anotar a mano)</span>
					<span className="li">
						La casilla <b>#</b> es el código de credencial; <b>Dor</b> es solo informativo.
					</span>
				</div>
			</footer>

			<style jsx>{`
				.sheet {
					--ink: #0a0a0a;
					--line: #111;
					--hair: #c9c9c9;
					--muted: #6b6b6b;
					--zebra: #f4f4f4;
					--paper: #fff;
					width: 216mm;
					min-height: 279mm;
					margin: 0 auto;
					background: var(--paper);
					padding: 11mm 11mm 10mm;
					box-shadow: 0 6px 30px rgba(0, 0, 0, 0.18);
					display: flex;
					flex-direction: column;
					font-family: var(--font-cedula-narrow, "Archivo Narrow"), Arial, sans-serif;
					color: var(--ink);
					line-height: 1.15;
					-webkit-print-color-adjust: exact;
					print-color-adjust: exact;
				}
				.mono {
					font-family: var(--font-cedula-mono, "Space Mono"), monospace;
				}

				.header {
					display: grid;
					grid-template-columns: 1fr auto 1fr;
					align-items: stretch;
					background: var(--ink);
					color: #fff;
					border: 2px solid var(--ink);
				}
				.h-left {
					display: flex;
					flex-direction: column;
					justify-content: center;
					gap: 4px;
					padding: 8px 12px;
				}
				.liga {
					font-family: var(--font-cedula-display, "Archivo"), sans-serif;
					font-size: 15px;
					font-weight: 800;
					letter-spacing: 0.04em;
					text-transform: uppercase;
					line-height: 1;
				}
				.chips {
					display: flex;
					gap: 5px;
					flex-wrap: wrap;
				}
				.chip {
					border: 1px solid rgba(255, 255, 255, 0.55);
					border-radius: 2px;
					padding: 2px 6px;
					font-size: 8px;
					font-weight: 700;
					letter-spacing: 0.06em;
					text-transform: uppercase;
				}
				.h-title {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 0 20px;
					text-align: center;
					border-left: 1px solid rgba(255, 255, 255, 0.3);
					border-right: 1px solid rgba(255, 255, 255, 0.3);
				}
				.h-title .k {
					font-family: var(--font-cedula-display, "Archivo"), sans-serif;
					font-size: 22px;
					font-weight: 900;
					letter-spacing: 0.16em;
					text-transform: uppercase;
					line-height: 1;
				}
				.h-title .s {
					font-size: 8px;
					letter-spacing: 0.34em;
					text-transform: uppercase;
					color: #bdbdbd;
					margin-top: 3px;
				}
				.h-folio {
					display: flex;
					flex-direction: column;
					align-items: flex-end;
					justify-content: center;
					padding: 8px 12px;
				}
				.h-folio .lbl {
					font-size: 7.5px;
					letter-spacing: 0.16em;
					text-transform: uppercase;
					color: #bdbdbd;
				}
				.h-folio .val {
					font-family: var(--font-cedula-mono, "Space Mono"), monospace;
					font-size: 26px;
					font-weight: 700;
					letter-spacing: 0.01em;
					line-height: 1.05;
				}

				.meta {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					border: 2px solid var(--ink);
					border-top: none;
				}
				.meta > div {
					padding: 5px 12px;
					border-right: 1px solid var(--ink);
				}
				.meta > div:last-child {
					border-right: none;
				}
				.meta .lbl {
					display: block;
					font-size: 7.5px;
					letter-spacing: 0.1em;
					text-transform: uppercase;
					color: var(--muted);
					margin-bottom: 1px;
				}
				.meta b {
					font-family: var(--font-cedula-narrow, "Archivo Narrow"), sans-serif;
					font-size: 13.5px;
					font-weight: 700;
				}

				.teams {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 6mm;
					margin-top: 5mm;
					flex: 1;
				}
				:global(.team) {
					display: flex;
					flex-direction: column;
					break-inside: avoid;
				}
				:global(.team-head) {
					display: flex;
					align-items: stretch;
					border: 2px solid var(--ink);
					margin-bottom: 0;
				}
				:global(.team-head .pill) {
					display: flex;
					align-items: center;
					background: var(--ink);
					color: #fff;
					font-family: var(--font-cedula-display, "Archivo"), sans-serif;
					font-size: 8.5px;
					font-weight: 800;
					letter-spacing: 0.1em;
					text-transform: uppercase;
					padding: 0 8px;
				}
				:global(.team-head .name) {
					flex: 1;
					display: flex;
					align-items: center;
					font-family: var(--font-cedula-display, "Archivo"), sans-serif;
					font-size: 15px;
					font-weight: 800;
					text-transform: uppercase;
					letter-spacing: 0.005em;
					line-height: 1;
					padding: 6px 8px;
				}
				:global(.team-head .score) {
					width: 34px;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					border-left: 2px solid var(--ink);
				}
				:global(.team-head .score .sl) {
					font-size: 6px;
					letter-spacing: 0.06em;
					text-transform: uppercase;
					color: var(--muted);
					margin-top: 2px;
				}
				:global(.team-head .score .sb) {
					flex: 1;
					width: 100%;
				}

				:global(.team table) {
					width: 100%;
					border-collapse: collapse;
					table-layout: fixed;
					border: 2px solid var(--ink);
					border-top: none;
				}
				:global(.team thead th) {
					background: var(--ink);
					color: #fff;
					text-align: left;
					font-family: var(--font-cedula-display, "Archivo"), sans-serif;
					font-size: 7px;
					font-weight: 700;
					letter-spacing: 0.08em;
					text-transform: uppercase;
					padding: 3px 4px;
				}
				:global(.team tbody td) {
					padding: 0 4px;
					border-bottom: 1px solid var(--hair);
					height: var(--row-h);
					vertical-align: middle;
				}
				:global(.team tbody tr:nth-child(even)) {
					background: var(--zebra);
				}

				:global(.c-code) {
					width: 13%;
					font-family: var(--font-cedula-mono, "Space Mono"), monospace;
					font-weight: 700;
					font-size: 11px;
				}
				:global(.c-name) {
					width: 39%;
				}
				:global(.c-dor) {
					width: 8%;
					color: var(--muted);
					font-size: 9px;
					text-align: center;
				}
				:global(.c-attend) {
					width: 12%;
					border-left: 1px solid var(--hair);
					text-align: center;
				}
				:global(.c-goals) {
					width: 13%;
					border-left: 1px solid var(--hair);
				}
				:global(.c-cards) {
					width: 15%;
					border-left: 1px solid var(--hair);
				}
				:global(thead .c-attend),
				:global(thead .c-goals),
				:global(thead .c-cards) {
					border-left: 1px solid rgba(255, 255, 255, 0.25);
					text-align: center;
				}

				:global(.pname) {
					font-weight: 600;
					font-size: var(--name-size);
					line-height: 1.05;
					display: block;
				}

				:global(.cards-cell) {
					display: flex;
					gap: 6px;
					align-items: center;
					justify-content: flex-start;
				}
				:global(.attend-cell) {
					display: flex;
					align-items: center;
					justify-content: center;
				}
				:global(.box) {
					width: 11px;
					height: 14px;
					border: 1.4px solid #444;
					border-radius: 1.5px;
					display: inline-block;
				}
				:global(.box.a) {
					border-color: #8a6d00;
				}
				:global(.box.r) {
					border-color: #8b0000;
				}
				:global(.box.att) {
					border-color: #444;
				}

				:global(tr.susp) {
					background: repeating-linear-gradient(
						135deg,
						#e2e2e2 0,
						#e2e2e2 3px,
						#fff 3px,
						#fff 7px
					) !important;
				}
				:global(tr.susp .c-code) {
					border-left: 3px solid var(--ink);
				}
				:global(.susp-name) {
					font-weight: 700;
					font-size: var(--name-size);
					line-height: 1.05;
					display: block;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				:global(tr.susp .blocked) {
					display: block;
					text-align: center;
					font-family: var(--font-cedula-display, "Archivo"), sans-serif;
					font-size: 7px;
					font-weight: 800;
					letter-spacing: 0.06em;
					color: #555;
					text-transform: uppercase;
					position: relative;
				}
				:global(tr.susp .c-attend),
				:global(tr.susp .c-goals),
				:global(tr.susp .c-cards) {
					background-image: linear-gradient(
						to bottom right,
						transparent calc(50% - 1px),
						#999,
						transparent calc(50% + 1px)
					);
				}

				:global(.blank-label) {
					font-family: var(--font-cedula-display, "Archivo"), sans-serif;
					font-size: 7px;
					font-weight: 800;
					letter-spacing: 0.1em;
					text-transform: uppercase;
					color: var(--muted);
					background: #eee;
					padding: 3px 4px;
				}
				:global(tr.blank td) {
					height: var(--row-h);
				}
				:global(tr.blank .c-name) {
					position: relative;
				}
				:global(tr.blank .c-name::after) {
					content: "";
					position: absolute;
					left: 4px;
					right: 8px;
					bottom: 4px;
					border-bottom: 1px dotted #bbb;
				}

				.foot {
					margin-top: auto;
					padding-top: 5mm;
					break-inside: avoid;
				}
				.obs {
					margin-bottom: 5mm;
				}
				.obs-label {
					font-family: var(--font-cedula-display, "Archivo"), sans-serif;
					font-size: 8.5px;
					font-weight: 800;
					letter-spacing: 0.08em;
					text-transform: uppercase;
					color: #222;
					margin-bottom: 4px;
				}
				.obs-line {
					border-bottom: 1px solid var(--hair);
					height: 6mm;
				}
				.signs {
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					gap: 16px;
				}
				.sign {
					display: flex;
					flex-direction: column;
				}
				.sign .line {
					border-bottom: 1.6px solid var(--ink);
					height: 30px;
				}
				.sign .lb {
					font-family: var(--font-cedula-display, "Archivo"), sans-serif;
					font-size: 8.5px;
					font-weight: 800;
					letter-spacing: 0.06em;
					text-transform: uppercase;
					color: #222;
					margin-top: 4px;
					text-align: center;
				}
				.sign .sub {
					font-size: 8px;
					color: var(--muted);
					text-align: center;
					margin-top: 1px;
				}

				.legend {
					margin-top: 4mm;
					border-top: 2px solid var(--ink);
					padding-top: 5px;
					display: flex;
					flex-wrap: wrap;
					gap: 4px 18px;
					font-size: 8px;
					color: #333;
				}
				.legend .li {
					display: flex;
					align-items: center;
					gap: 5px;
				}
				.lg-box {
					width: 10px;
					height: 12px;
					border: 1.4px solid #444;
					border-radius: 1.5px;
					display: inline-block;
				}
				.lg-box.a {
					border-color: #8a6d00;
				}
				.lg-box.r {
					border-color: #8b0000;
				}
				.lg-susp {
					width: 16px;
					height: 12px;
					border: 1px solid var(--line);
					border-left: 3px solid var(--ink);
					background: repeating-linear-gradient(135deg, #e2e2e2 0, #e2e2e2 2px, #fff 2px, #fff 5px);
					display: inline-block;
				}
				.legend b {
					font-weight: 700;
				}

				@media print {
					.sheet {
						width: auto;
						/* min-height se mantiene en 279mm (Letter, @page en layout.tsx) para que
						   .foot con margin-top:auto quede pegado al fondo real de la hoja incluso
						   con roster corto. Si el roster desborda, la hoja simplemente crece a
						   más de 279mm y pasa a una 2ª página (thead repetido, ver abajo). */
						margin: 0;
						box-shadow: none;
					}
					/* Si el roster desborda a una 2ª hoja, repite el encabezado de columnas (§7 spec). */
					:global(.team thead) {
						display: table-header-group;
					}
				}
			`}</style>
		</div>
	);
}
