/**
 * /admin/organizacion/miembros — tab Miembros (docs/ORG-PROFILE-HUB.md D-1,
 * decisión abierta). Solo lectura por ahora: la gestión real sigue viviendo
 * en /admin/organizations/[id] (vista owner). Este tab existe para que el
 * organizador vea quién es parte de su organización, tal cual el diseño
 * (lista atenuada + nota de que la gestión aún no vive aquí).
 */

import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getUsersByOrganization } from "@/entities/organization";
import { Avatar, Badge, Card } from "@/shared/ui";
import { resolveHubOrg } from "../resolve-org";
import { OrgHubShell } from "../OrgHubShell";
import { OrgPicker } from "../OrgPicker";

type Props = { searchParams: Promise<{ org?: string }> };

export default async function OrgMiembrosPage({ searchParams }: Props) {
	const { org: orgSlug } = await searchParams;
	const { user, org } = await resolveHubOrg(orgSlug);

	if (!org) {
		if (user.role === "owner") return <OrgPicker />;
		redirect("/admin");
	}

	const members = await getUsersByOrganization(org.id);

	return (
		<OrgHubShell org={org} isOwner={user.role === "owner"}>
			<div>
				<div className="flex items-start gap-2.5 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg px-4 py-3 mb-5">
					<AlertCircle size={15} strokeWidth={1.75} className="text-amber-300 shrink-0 mt-0.5" />
					<p className="text-[12.5px] text-ink-2 leading-snug">
						La gestión de miembros hoy es solo para el dueño (owner). Pendiente de decidir si el
						organizador la administra desde aquí.
					</p>
				</div>
				<div className="flex flex-col gap-2 opacity-60 pointer-events-none select-none">
					{members.map((m) => (
						<Card key={m.id} className="p-3.5 flex items-center gap-3">
							<Avatar
								initials={m.name
									.split(" ")
									.map((p) => p[0])
									.slice(0, 2)
									.join("")
									.toUpperCase()}
								size="md"
								tone={m.role === "owner" ? "brand" : "neutral"}
							/>
							<div className="flex-1 min-w-0">
								<h4 className="text-[13.5px] font-semibold text-ink truncate">{m.name}</h4>
								<p className="text-[12px] text-ink-3 truncate">{m.email}</p>
							</div>
							<Badge tone={m.role === "owner" ? "brand" : "neutral"}>
								{m.role === "owner" ? "Owner" : "Organizador"}
							</Badge>
						</Card>
					))}
					{members.length === 0 && (
						<p className="text-sm text-ink-2">Sin miembros registrados todavía.</p>
					)}
				</div>
			</div>
		</OrgHubShell>
	);
}
