/**
 * app/admin/organizacion/OrgHubShell.tsx
 * Cabecera + OrgTabBar compartidos por todos los tabs del hub. Se invoca
 * desde cada page.tsx (no es un layout.tsx — ver resolve-org.ts) envolviendo
 * su contenido.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import type { Organization } from "@/entities/organization";
import { OrgTabBar } from "@/shared/ui";

type Props = {
	org: Organization;
	isOwner: boolean;
	children: ReactNode;
};

export function OrgHubShell({ org, isOwner, children }: Props) {
	return (
		<div className="p-6">
			<Link href="/admin" className="text-sm text-ink-2 hover:underline">
				← Dashboard
			</Link>

			<div className="flex items-start justify-between gap-4 mt-1">
				<div>
					<h1 className="text-2xl font-bold text-ink">Organización</h1>
					<p className="text-ink-2 text-sm">
						Administra los datos y valores por defecto de{" "}
						<span className="font-medium text-ink">{org.name}</span>
					</p>
				</div>
			</div>

			<OrgTabBar orgSlug={isOwner ? org.slug : undefined} />

			<div className="mt-4">{children}</div>
		</div>
	);
}
