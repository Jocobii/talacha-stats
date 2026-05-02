import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import { getOrganizationWithDetails } from "@/entities/organization";
import { listUsers } from "@/entities/user";
import OrganizationDetailClient from "./OrganizationDetailClient";

export default async function OrganizationDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await getSessionUser();
	if (!session) redirect("/login");

	// Organizer solo puede ver su propia org
	if (session.role !== "owner" && session.organizationId !== id) {
		redirect("/admin/organizations");
	}

	const org = await getOrganizationWithDetails(id);
	if (!org) notFound();

	// Solo el owner puede ver la lista completa de usuarios para asignar miembros
	const allUsers =
		session.role === "owner"
			? (await listUsers()).filter((u) => u.role === "organizer" && u.active)
			: [];

	return (
		<div>
			<div className="mb-6">
				<Link href="/admin/organizations" className="text-sm text-ink-2 hover:underline">
					← Organizaciones
				</Link>
				<div className="flex items-start gap-4 mt-2">
					{org.logoUrl ? (
						<img src={org.logoUrl} alt={org.name} className="w-14 h-14 rounded-xl object-cover" />
					) : (
						<div className="w-14 h-14 rounded-xl bg-brand/15 flex items-center justify-center flex-shrink-0">
							<span className="text-brand font-bold text-2xl">
								{org.name.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
					<div>
						<h1 className="text-2xl font-bold text-ink">{org.name}</h1>
						<p className="text-sm text-ink-3">
							{org.city} · /{org.slug}
						</p>
					</div>
				</div>
			</div>

			<OrganizationDetailClient
				org={org}
				allUsers={allUsers.map((u) => ({ id: u.id, name: u.name, email: u.email }))}
				isOwner={session.role === "owner"}
			/>
		</div>
	);
}
