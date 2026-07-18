/**
 * app/admin/players/playersColumns.tsx
 *
 * Definición de columnas de AdminTable para jugadores — separado de
 * PlayersTable.tsx para mantener ambos archivos por debajo del límite de
 * tamaño (AGENTS.md §3.5). Solo config declarativa, sin lógica de componente.
 */

import { Badge } from "@/shared/ui/Badge";
import { Avatar } from "@/shared/ui/Avatar";
import type { AdminTableColumn } from "@/shared/ui/AdminTable";
import type { OrgPlayerRow, GlobalPlayerRow } from "@/entities/player";

const CREDENTIAL_TONE: Record<
	OrgPlayerRow["credentialStatus"],
	"brand" | "warn" | "danger" | "neutral"
> = {
	vigente: "brand",
	porvencer: "warn",
	pendiente: "neutral",
	vencida: "danger",
	suspendida: "danger",
	cancelada: "neutral",
};
const CREDENTIAL_LABEL: Record<OrgPlayerRow["credentialStatus"], string> = {
	vigente: "Vigente",
	porvencer: "Por vencer",
	pendiente: "Pendiente",
	vencida: "Vencida",
	suspendida: "Suspendida",
	cancelada: "Cancelada",
};

function formatCredentialDetail(row: OrgPlayerRow): string | null {
	if (!row.credentialScope) return null;
	const scopeLabel = row.credentialScope === "organization" ? "Anual" : "Por liga";
	if (!row.credentialValidUntil) return scopeLabel;
	const validUntil = new Date(`${row.credentialValidUntil}T00:00:00`).toLocaleDateString("es-MX", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
	return `${scopeLabel} · vence ${validUntil}`;
}

const STATUS_TONE: Record<string, "brand" | "warn" | "neutral"> = {
	active: "brand",
	suspended: "warn",
	inactive: "neutral",
};
const STATUS_LABEL: Record<string, string> = {
	active: "Activo",
	suspended: "Suspendido",
	inactive: "Inactivo",
};

function initials(fullName: string): string {
	return fullName
		.split(" ")
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();
}

function PlayerCell({ fullName }: { fullName: string }) {
	return (
		<div className="flex items-center gap-2.5">
			<Avatar initials={initials(fullName)} size="sm" />
			<span className="font-medium text-ink">{fullName}</span>
		</div>
	);
}

export const ORG_PLAYER_COLUMNS: AdminTableColumn<OrgPlayerRow>[] = [
	{
		key: "fullName",
		label: "Jugador",
		sortField: "nombre",
		render: (p) => <PlayerCell fullName={p.fullName} />,
	},
	{
		key: "latestLeagueName",
		label: "Liga",
		hiddenMobile: true,
		render: (p) => <span className="text-ink-2 text-sm">{p.latestLeagueName ?? "—"}</span>,
	},
	{
		key: "latestTeamName",
		label: "Equipo",
		hiddenMobile: true,
		render: (p) => <span className="text-ink-2 text-sm">{p.latestTeamName ?? "—"}</span>,
	},
	{
		key: "leagueCount",
		label: "Ligas",
		align: "center",
		hiddenMobile: true,
		render: (p) => <Badge tone="neutral">{p.leagueCount}</Badge>,
	},
	{
		key: "latestDorsal",
		label: "#",
		align: "right",
		sortField: "dorsal",
		render: (p) =>
			p.latestDorsal != null ? (
				<span className="font-mono text-ink-2">{p.latestDorsal}</span>
			) : (
				<span className="text-ink-3 text-xs">—</span>
			),
	},
	{
		key: "latestStatus",
		label: "Estado",
		render: (p) =>
			p.latestStatus ? (
				<Badge tone={STATUS_TONE[p.latestStatus] ?? "neutral"}>
					{STATUS_LABEL[p.latestStatus] ?? p.latestStatus}
				</Badge>
			) : (
				<span className="text-ink-3 text-xs">—</span>
			),
	},
	{
		key: "credentialStatus",
		label: "Credencial",
		hiddenMobile: true,
		render: (p) => {
			const detail = formatCredentialDetail(p);
			return (
				<div className="flex flex-col gap-0.5" title={detail ?? undefined}>
					<Badge tone={CREDENTIAL_TONE[p.credentialStatus]}>
						{CREDENTIAL_LABEL[p.credentialStatus]}
					</Badge>
					{detail && <span className="text-[10px] text-ink-3">{detail}</span>}
				</div>
			);
		},
	},
];

export const OWNER_PLAYER_COLUMNS: AdminTableColumn<GlobalPlayerRow>[] = [
	{
		key: "fullName",
		label: "Jugador",
		render: (p) => <PlayerCell fullName={p.fullName} />,
	},
	{
		key: "leagueCount",
		label: "Ligas",
		align: "center",
		hiddenMobile: true,
		render: (p) => <Badge tone="neutral">{p.leagueCount}</Badge>,
	},
];
