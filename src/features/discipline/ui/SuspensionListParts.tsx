"use client";

/**
 * features/discipline/ui/SuspensionListParts.tsx
 * Piezas compartidas entre la vista por liga (SuspensionsScreen, B7) y la
 * vista global (GlobalSuspensionsScreen, B7b): tile de resumen, chip de
 * filtro, badge de motivo, indicador de duración y la fila de la lista.
 * `SuspensionRow` acepta `leagueName` opcional — la vista global lo pasa
 * para poder distinguir de qué liga es cada sanción sin cambiar de pantalla.
 */

import type { ComponentType, ReactNode } from "react";
import { AlertCircle, Ban, CheckCircle, ArrowUpCircle, Undo2 } from "lucide-react";
import { Card, SectionLabel, Badge, Button, Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { SuspensionListItemDto } from "@/entities/suspension";
import { fmtIsoDate, initialsFromName, weeksLeft } from "../lib/format-suspension";

export function SummaryTile({
	label,
	value,
	icon: Icon,
	tone,
}: {
	label: string;
	value: number;
	icon: ComponentType<{ size?: number; strokeWidth?: number }>;
	tone?: "danger";
}) {
	return (
		<Card className="p-5">
			<div className="flex items-start justify-between">
				<SectionLabel>{label}</SectionLabel>
				<span className={tone === "danger" ? "text-red-400" : "text-ink-3"}>
					<Icon size={14} strokeWidth={1.75} />
				</span>
			</div>
			<div
				className={cn(
					"mt-3 font-display text-4xl font-black tracking-tight leading-none",
					tone === "danger" && value > 0 ? "text-red-400" : "text-ink",
				)}
			>
				{value}
			</div>
		</Card>
	);
}

export function EstadoChip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"h-8 px-3.5 rounded-full text-[13px] font-semibold border transition",
				active
					? "bg-brand/10 text-brand-ink border-brand/30"
					: "bg-surface-2 text-ink-2 border-line hover:text-ink hover:border-ink-3",
			)}
		>
			{children}
		</button>
	);
}

function ReasonBadge({ s }: { s: SuspensionListItemDto }) {
	if (s.durationType === "permanent") {
		return (
			<Badge tone={s.status === "active" ? "danger" : "neutral"} icon={Ban}>
				{s.reason === "manual" ? "Veto manual" : "Veto"}
			</Badge>
		);
	}
	if (s.durationType === "time") {
		return (
			<Badge tone="warn" icon={AlertCircle}>
				{s.reason === "red_card" ? "Roja directa · escalada" : "Escalada"}
			</Badge>
		);
	}
	const label =
		s.reason === "red_card"
			? "Roja directa"
			: s.reason === "yellow_accumulation"
				? "Acumulación de amarillas"
				: "Manual";
	return <Badge tone="neutral">{label}</Badge>;
}

function DurationIndicator({ s }: { s: SuspensionListItemDto }) {
	if (s.status === "lifted") {
		return <Badge tone="neutral">Levantada</Badge>;
	}
	if (s.status === "served") {
		return (
			<Badge tone="neutral" icon={CheckCircle}>
				Sanción cumplida
			</Badge>
		);
	}
	if (s.durationType === "permanent") {
		return (
			<span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-red-500 text-white text-[11.5px] font-bold tracking-[0.06em] uppercase">
				<Ban size={12} strokeWidth={2.25} /> Veto indefinido
			</span>
		);
	}
	if (s.durationType === "time" && s.endsOn) {
		return (
			<div className="text-right">
				<div className="text-[13.5px] font-semibold text-amber-300">
					Hasta {fmtIsoDate(s.endsOn)}
				</div>
				<div className="text-[12px] text-ink-3 mt-0.5">
					faltan {weeksLeft(s.endsOn)} semana{weeksLeft(s.endsOn) !== 1 ? "s" : ""}
				</div>
			</div>
		);
	}
	// matches
	const total = s.matchesTotal ?? 0;
	const dots = Array.from({ length: total });
	return (
		<div className="text-right">
			<div className="flex items-center gap-1.5 justify-end">
				{dots.map((_, i) => (
					<span
						key={i}
						className={cn("w-2 h-2 rounded-full", i < s.matchesServed ? "bg-brand" : "bg-ink-3/40")}
					/>
				))}
			</div>
			<div className="text-[12px] text-ink-3 mt-1">
				{s.matchesServed} de {total} fecha{total !== 1 ? "s" : ""} cumplida
				{s.matchesServed !== 1 ? "s" : ""}
			</div>
		</div>
	);
}

export function SuspensionRow({
	s,
	leagueName,
	onEscalate,
	onLift,
}: {
	s: SuspensionListItemDto;
	/** Vista global (B7b): nombre de la liga, mostrado junto al equipo. */
	leagueName?: string;
	onEscalate: () => void;
	onLift: () => void;
}) {
	const severe = s.durationType !== "matches" && s.status === "active";
	return (
		<Card
			className={cn(
				"p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4",
				severe && s.durationType === "permanent" && "border-red-500/25",
				severe && s.durationType === "time" && "border-amber-500/25",
			)}
		>
			<div className="flex items-start gap-3 flex-1 min-w-0">
				<Avatar
					initials={initialsFromName(s.playerName)}
					size="md"
					tone={s.durationType === "permanent" && s.status === "active" ? "neutral" : "brand"}
				/>
				<div className="min-w-0">
					<h3 className="text-[14.5px] font-semibold text-ink truncate">{s.playerName}</h3>
					<p className="text-[12.5px] text-ink-2 mt-0.5">
						{s.teamName}
						{leagueName && <span className="text-ink-3"> · {leagueName}</span>}
					</p>
					<div className="mt-2 flex items-center gap-2 flex-wrap">
						<ReasonBadge s={s} />
					</div>
				</div>
			</div>

			<div className="flex items-center gap-4 sm:gap-6 shrink-0 justify-between sm:justify-end">
				<DurationIndicator s={s} />
				<div className="flex items-center gap-2">
					{s.status === "active" && s.durationType !== "permanent" && (
						<Button variant="ghost" size="sm" icon={ArrowUpCircle} onClick={onEscalate}>
							Escalar
						</Button>
					)}
					{s.status === "active" && s.durationType === "permanent" && (
						<Button variant="secondary" size="sm" icon={Undo2} onClick={onLift}>
							Levantar
						</Button>
					)}
				</div>
			</div>
		</Card>
	);
}
