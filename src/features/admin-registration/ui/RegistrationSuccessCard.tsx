"use client";

/**
 * features/admin-registration/ui/RegistrationSuccessCard.tsx
 * Estado: alta exitosa — resumen de la inscripción.
 */

import { Check, UserPlus, ArrowRight, IdCard } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Avatar } from "@/shared/ui/Avatar";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { formatDateEs, getPlayerInitials, buildDorsalLabel } from "../lib/registration-utils";
import type { SuccessData, Team, League } from "../types";

type Props = {
	data: SuccessData;
	teams: Team[];
	league?: League;
	sessionCount: number;
	onNext: () => void;
	onEnd: () => void;
};

export function RegistrationSuccessCard({
	data,
	teams,
	league,
	sessionCount,
	onNext,
	onEnd,
}: Props) {
	const teamName = data.inscription
		? (teams.find((t) => t.id === data.inscription?.teamId)?.name ?? "equipo")
		: null;

	const dorsalLabel = buildDorsalLabel(data.leagueMember.dorsal);

	return (
		<Card className="p-8 sm:p-10 relative overflow-hidden">
			<div
				className="absolute inset-0 -z-10 opacity-[0.07] pointer-events-none"
				style={{
					background: "radial-gradient(500px 200px at 50% 0%, #00E676 0%, transparent 70%)",
				}}
			/>

			<div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
				<div className="relative shrink-0">
					<Avatar initials={getPlayerInitials(data.globalPlayer.fullName)} size="xl" />
					<span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand grid place-items-center border-2 border-pitch">
						<Check size={13} strokeWidth={3} className="text-pitch" />
					</span>
				</div>

				<div className="flex-1 min-w-0">
					<SectionLabel className="!text-brand">
						{data.isNew ? "Jugador creado y registrado" : "Registrado"}
					</SectionLabel>
					<h2 className="font-display text-[28px] sm:text-[36px] text-ink tracking-tight leading-[0.95] mt-1 break-words">
						{data.globalPlayer.fullName}
					</h2>
					{teamName && (
						<p className="text-ink-2 text-[16px] sm:text-[18px] font-semibold mt-1">
							en {teamName}
							{dorsalLabel}
						</p>
					)}
					{league && (
						<p className="mt-2 text-sm text-ink-2">
							{league.name} &middot; {league.season}. Su perfil ya está activo.
						</p>
					)}
				</div>
			</div>

			<div className="mt-7 pt-6 border-t border-line grid grid-cols-2 sm:grid-cols-4 gap-3">
				<KV label="Esta sesión" value={String(sessionCount)} />
				<KV label="Inscripción" value={formatDateEs(data.leagueMember.inscriptionDate)} />
				{data.leagueMember.dorsal && <KV label="Dorsal" value={`#${data.leagueMember.dorsal}`} />}
			</div>

			<div className="mt-7 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<span className="text-[12px] text-ink-3 flex items-center gap-1.5">
					<IdCard size={13} strokeWidth={1.75} />
					ID {data.globalPlayer.id.slice(0, 8)}&hellip;
				</span>
				<div className="flex gap-2">
					<Button variant="secondary" size="md" type="button" onClick={onEnd}>
						Terminar
					</Button>
					<Button
						variant="primary"
						size="md"
						icon={UserPlus}
						iconRight={ArrowRight}
						type="button"
						onClick={onNext}
					>
						Registrar otro
					</Button>
				</div>
			</div>
		</Card>
	);
}

function KV({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-surface-2/40 border border-line rounded-md px-3 py-2.5">
			<dt className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-3">{label}</dt>
			<dd className="mt-1 text-[14px] text-ink">{value}</dd>
		</div>
	);
}
