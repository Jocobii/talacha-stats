"use client";

/**
 * app/admin/players/[id]/CredentialProfileSection.tsx
 *
 * Sección "Credenciales" del perfil de jugador (pantalla D,
 * docs/CREDENCIAL-PASE-JUGADOR.md) — pases agrupados por organización, con
 * botón Emitir/Renovar cuando se puede resolver una liga de esa organización
 * (el pase se emite desde el contexto de una liga — ver IssueCredentialModal).
 * Server Component padre: recibe todo ya resuelto, sin fetch propio.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { IssueCredentialModal } from "@/features/player-credential/ui/IssueCredentialModal";
import type {
	PlayerCredentialWithContext,
	CredentialDisplayStatus,
} from "@/entities/player-credential";
import type { OrganizationCredentialConfigDto } from "@/entities/organization-credential-config";

const STATUS_TONE: Record<CredentialDisplayStatus, "brand" | "warn" | "danger" | "neutral"> = {
	vigente: "brand",
	porvencer: "warn",
	pendiente: "neutral",
	vencida: "danger",
	suspendida: "danger",
	cancelada: "neutral",
};
const STATUS_LABEL: Record<CredentialDisplayStatus, string> = {
	vigente: "Vigente",
	porvencer: "Por vencer",
	pendiente: "Pendiente",
	vencida: "Vencida",
	suspendida: "Suspendida",
	cancelada: "Cancelada",
};

type CredentialGroup = {
	organizationId: string;
	organizationName: string;
	credentials: PlayerCredentialWithContext[];
};

type Props = {
	globalPlayerId: string;
	playerName: string;
	groups: CredentialGroup[];
	canEdit: boolean;
	leagueIdByOrg: Record<string, string | undefined>;
	orgConfigByOrg: Record<string, OrganizationCredentialConfigDto | undefined>;
};

export function CredentialProfileSection({
	globalPlayerId,
	playerName,
	groups,
	canEdit,
	leagueIdByOrg,
	orgConfigByOrg,
}: Props) {
	return (
		<section>
			<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wider mb-3">
				Credenciales ({groups.reduce((n, g) => n + g.credentials.length, 0)})
			</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{groups.map((group) => (
					<OrgCredentialCard
						key={group.organizationId}
						group={group}
						globalPlayerId={globalPlayerId}
						playerName={playerName}
						canEdit={canEdit}
						leagueId={leagueIdByOrg[group.organizationId]}
						orgConfig={orgConfigByOrg[group.organizationId]}
					/>
				))}
			</div>
		</section>
	);
}

function OrgCredentialCard({
	group,
	globalPlayerId,
	playerName,
	canEdit,
	leagueId,
	orgConfig,
}: {
	group: CredentialGroup;
	globalPlayerId: string;
	playerName: string;
	canEdit: boolean;
	leagueId: string | undefined;
	orgConfig: OrganizationCredentialConfigDto | undefined;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	// Pase más reciente primero (listCredentialsForPlayer ya ordena por createdAt desc).
	const latest = group.credentials[0];
	const canIssue =
		canEdit && !!leagueId && !!orgConfig && latest && latest.displayStatus !== "vigente";
	const isRenewal = latest?.displayStatus === "vencida" || latest?.displayStatus === "porvencer";

	return (
		<div className="bg-surface rounded-xl shadow border border-line p-5 space-y-3">
			<p className="font-bold text-ink text-base leading-tight">{group.organizationName}</p>

			<div className="space-y-2">
				{group.credentials.map((c) => (
					<div
						key={c.id}
						className="flex items-center gap-2.5 bg-surface-2 border border-line rounded-lg px-3 py-2.5"
					>
						<ShieldCheck size={15} strokeWidth={2} className="text-ink-3 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-[13px] font-medium text-ink">
								{c.scope === "organization"
									? "Pase anual"
									: `Pase por liga${c.leagueName ? ` · ${c.leagueName}` : ""}`}
							</p>
							{c.validUntil && (
								<p className="text-[11px] text-ink-3">
									Vence{" "}
									{new Date(`${c.validUntil}T00:00:00`).toLocaleDateString("es-MX", {
										day: "numeric",
										month: "short",
										year: "numeric",
									})}
								</p>
							)}
						</div>
						<Badge tone={STATUS_TONE[c.displayStatus]}>{STATUS_LABEL[c.displayStatus]}</Badge>
					</div>
				))}
			</div>

			{canIssue && (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="text-xs px-2.5 py-1.5 rounded-lg border border-line text-ink-2 hover:bg-surface-2 hover:text-ink font-medium transition"
				>
					{isRenewal ? "Renovar pase" : "Emitir pase"}
				</button>
			)}

			{open && leagueId && orgConfig && (
				<IssueCredentialModal
					onClose={() => setOpen(false)}
					globalPlayerId={globalPlayerId}
					leagueId={leagueId}
					playerName={playerName}
					orgConfig={orgConfig}
					currentDisplayStatus={latest?.displayStatus}
					onIssued={() => router.refresh()}
				/>
			)}
		</div>
	);
}
