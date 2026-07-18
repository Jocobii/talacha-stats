"use client";

import Link from "next/link";
import { Info, ChevronRight, MapPin, Settings, Calendar } from "lucide-react";
import { StatusPill } from "@/shared/ui";
import { Stack, Inline, Center } from "@/shared/ui/layout";
import type { CockpitMatchday, CockpitConfig, VenueOption } from "../types";

type ContextPanelProps = {
	matchday: CockpitMatchday | null;
	leagueId: string;
	onOpenSettings: (tab: string) => void;
	config: CockpitConfig | null;
	venues: VenueOption[];
};

type SetupRowProps = {
	icon: React.ReactNode;
	label: string;
	value: string;
	onClick?: () => void;
	href?: string;
	emphasize?: boolean;
};

const SETUP_ROW_CLASS = "flex w-full items-center gap-2 px-1 py-1.5 text-left";

function SetupRow({ icon, label, value, onClick, href, emphasize }: SetupRowProps) {
	const style: React.CSSProperties = {
		background: "transparent",
		border: "none",
		borderTop: "1px solid var(--color-line)",
		color: "var(--color-ink-2)",
		fontFamily: "inherit",
		fontSize: 12,
		cursor: "pointer",
		textDecoration: "none",
	};
	const inner = (
		<>
			{icon}
			<span className="flex-1">{label}</span>
			<span
				style={{ color: emphasize ? "var(--color-brand)" : "var(--color-ink-3)", fontSize: 11 }}
			>
				{value}
			</span>
			<ChevronRight size={10} />
		</>
	);
	return href ? (
		<Link href={href} className={SETUP_ROW_CLASS} style={style}>
			{inner}
		</Link>
	) : (
		<button className={SETUP_ROW_CLASS} style={style} onClick={onClick}>
			{inner}
		</button>
	);
}

function MatchdayTimeline({ matchday }: { matchday: CockpitMatchday | null }) {
	return (
		<div className="surface-card p-3.5">
			<h3 className="section-label m-0 mb-2.5">Línea de jornadas</h3>
			<Stack gap="xs">
				{[3, 2, 1].map((offset) => {
					const n = matchday ? matchday.number - offset : null;
					if (!n || n < 1) return null;
					return (
						<Inline
							key={offset}
							align="center"
							gap="sm"
							className="rounded-md px-2 py-[5px]"
							style={{ opacity: 0.45 }}
						>
							<Center
								className="h-6 w-6 rounded-md"
								style={{
									fontFamily: "var(--font-display)",
									fontWeight: 800,
									fontSize: 13,
									color: "var(--color-ink-3)",
									background: "var(--color-surface-2)",
								}}
							>
								{n}
							</Center>
							<div className="flex-1" style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
								Jornada {n}
							</div>
						</Inline>
					);
				})}
				{matchday && (
					<Inline
						align="center"
						gap="sm"
						className="rounded-[7px] px-2 py-1.5"
						style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.3)" }}
					>
						<Center
							className="h-6 w-6 rounded-md"
							style={{
								fontFamily: "var(--font-display)",
								fontWeight: 800,
								fontSize: 13,
								color: "var(--color-brand)",
								background: "rgba(0,230,118,0.12)",
							}}
						>
							{matchday.number}
						</Center>
						<div
							className="flex-1"
							style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)" }}
						>
							Jornada {matchday.number}
						</div>
						<StatusPill status={matchday.status} size="sm" />
					</Inline>
				)}
			</Stack>
		</div>
	);
}

export function ContextPanel({
	matchday,
	leagueId,
	onOpenSettings,
	config,
	venues,
}: ContextPanelProps) {
	const durationLabel = config
		? `${config.matchDurationMinutes} min · ${config.bufferMinutes} min buffer`
		: "—";

	return (
		<Stack as="section" gap="md" className="h-full min-h-0 overflow-y-auto">
			<MatchdayTimeline matchday={matchday} />

			<div className="surface-card p-3">
				<Inline align="start" gap="sm">
					<Info size={13} color="var(--color-blue)" />
					<div className="flex-1">
						<div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)" }}>
							Ventana de edición
						</div>
						<div
							className="mt-[3px]"
							style={{ fontSize: 11, color: "var(--color-ink-2)", lineHeight: 1.5 }}
						>
							Puedes editar hasta el mismo día de la jornada. Después se bloquea automáticamente.
						</div>
					</div>
				</Inline>
			</div>

			<div className="surface-card p-3">
				<h3 className="section-label m-0 mb-2">Canchas</h3>
				{venues.length === 0 ? (
					<Link
						href={`/admin/leagues/${leagueId}/canchas`}
						className="block w-full cursor-pointer rounded-[7px] px-2 py-2.5 text-center no-underline"
						style={{
							background: "rgba(251,191,36,0.06)",
							border: "1px dashed rgba(251,191,36,0.3)",
							color: "var(--color-amber)",
							fontSize: 11.5,
						}}
					>
						Sin canchas configuradas → Agregar
					</Link>
				) : (
					<>
						<Stack gap="xs" className="mb-2">
							{venues.map((v) => (
								<Inline
									key={v.id}
									align="center"
									gap="sm"
									className="rounded-md px-1.5 py-[5px]"
									style={{ background: "rgba(255,255,255,0.03)" }}
								>
									<MapPin size={10} color="var(--color-ink-3)" />
									<span className="flex-1" style={{ fontSize: 12, color: "var(--color-ink-2)" }}>
										{v.name}
									</span>
									{v.slots.length > 0 && (
										<span
											style={{
												fontSize: 10,
												color: "var(--color-ink-3)",
												fontFamily: "var(--font-mono, monospace)",
											}}
										>
											{v.slots[0]}
											{v.slots.length > 1 && `+${v.slots.length - 1}`}
										</span>
									)}
								</Inline>
							))}
						</Stack>
						<Link
							href={`/admin/leagues/${leagueId}/canchas`}
							className="inline-block py-0.5 no-underline"
							style={{ color: "var(--color-ink-3)", fontSize: 11 }}
						>
							+ Editar canchas
						</Link>
					</>
				)}
			</div>

			<div className="surface-card p-3">
				<h3 className="section-label m-0 mb-2">Configuración base</h3>
				<SetupRow
					icon={<Settings size={12} />}
					label="Parámetros"
					value={durationLabel}
					onClick={() => onOpenSettings("parametros")}
				/>
				<SetupRow
					icon={<Calendar size={12} />}
					label="Calendario"
					value="Ver completo"
					href={`/admin/leagues/${leagueId}/calendario`}
					emphasize
				/>
			</div>
		</Stack>
	);
}
