/**
 * app/admin/organizacion/OrgPicker.tsx
 * Selector de organización para el owner cuando no vino ?org=<slug> —
 * mismo patrón que tema/page.tsx tenía antes de existir el hub.
 */

import Link from "next/link";
import { listOrganizations } from "@/entities/organization";

export async function OrgPicker() {
	const orgs = await listOrganizations();

	return (
		<div className="p-6 space-y-6">
			<header>
				<h1 className="text-2xl font-semibold text-ink">Organización</h1>
				<p className="text-sm text-ink-2 mt-1">
					Como owner puedes administrar cualquier organización. Elige una:
				</p>
			</header>
			<ul className="space-y-2">
				{orgs.map((o) => (
					<li key={o.id}>
						<Link
							href={`/admin/organizacion?org=${o.slug}`}
							className="inline-block rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-line-2"
						>
							{o.name} <span className="text-ink-2">/{o.slug}</span>
						</Link>
					</li>
				))}
				{orgs.length === 0 && (
					<li className="text-sm text-ink-2">No hay organizaciones registradas todavía.</li>
				)}
			</ul>
		</div>
	);
}
