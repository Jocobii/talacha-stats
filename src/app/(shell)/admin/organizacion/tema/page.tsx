/**
 * /admin/organizacion/tema — identidad visual de la organización.
 *
 * - organizer: edita SU organización (la de su sesión).
 * - owner: edita cualquiera — vía ?org=<slug>, o elige de la lista.
 *   (El API route ya permite al owner editar cualquier org.)
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import {
	getOrganizationById,
	getOrganizationBySlug,
	listOrganizations,
} from "@/entities/organization";
import { OrgThemePanel } from "@/features/org-theming";
import { getSessionUser } from "@/shared/lib/auth";

type Props = { searchParams: Promise<{ org?: string }> };

export default async function OrgThemePage({ searchParams }: Props) {
	const user = await getSessionUser();
	if (!user) redirect("/login");

	const { org: orgSlug } = await searchParams;

	// Resolver la organización a editar según rol
	const org =
		user.role === "owner" && orgSlug
			? await getOrganizationBySlug(orgSlug)
			: user.organizationId
				? await getOrganizationById(user.organizationId)
				: null;

	// Owner sin org resuelta → selector
	if (!org && user.role === "owner") {
		const orgs = await listOrganizations();
		return (
			<div className="p-6 space-y-6">
				<header>
					<h1 className="text-2xl font-semibold text-ink">Identidad visual</h1>
					<p className="text-sm text-ink-2 mt-1">
						Como owner puedes editar el tema de cualquier organización. Elige una:
					</p>
				</header>
				<ul className="space-y-2">
					{orgs.map((o) => (
						<li key={o.id}>
							<Link
								href={`/admin/organizacion/tema?org=${o.slug}`}
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

	if (!org) redirect("/admin");

	return (
		<div className="p-6 space-y-6">
			<header>
				<h1 className="text-2xl font-semibold text-ink">Identidad visual</h1>
				<p className="text-sm text-ink-2 mt-1">
					Elige la paleta y tipografía de <span className="font-medium">{org.name}</span>. Se aplica
					a su página pública (/org/{org.slug}) y a las imágenes para compartir. Sin tema, se usa la
					paleta TalachaStats.
				</p>
			</header>
			<OrgThemePanel organizationId={org.id} orgName={org.name} />
		</div>
	);
}
