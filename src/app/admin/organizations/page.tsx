import Link from "next/link";
import { getSessionUser } from "@/shared/lib/auth";
import { listOrganizations, getOrganizationByUserId } from "@/entities/organization";
import { redirect } from "next/navigation";

export default async function OrganizationsPage() {
	const session = await getSessionUser();
	if (!session) redirect("/login");

	// Organizer: redirigir directo a su org si ya tiene una
	if (session.role === "organizer") {
		if (session.organizationId) {
			redirect(`/admin/organizations/${session.organizationId}`);
		}
		// Sin org asignada — mostrar mensaje
		return (
			<div className="max-w-lg mx-auto mt-12 text-center">
				<p className="text-4xl mb-4">🏢</p>
				<h1 className="text-xl font-bold text-ink mb-2">Sin organización asignada</h1>
				<p className="text-ink-2 text-sm">
					Pide al administrador que te asigne a una organización.
				</p>
			</div>
		);
	}

	const organizations = await listOrganizations();

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-ink">Organizaciones</h1>
					<p className="text-sm text-ink-3 mt-0.5">{organizations.length} registradas</p>
				</div>
				<Link
					href="/admin/organizations/new"
					className="bg-brand text-pitch px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dim"
				>
					+ Nueva organización
				</Link>
			</div>

			{organizations.length === 0 ? (
				<div className="bg-surface rounded-xl shadow p-12 text-center">
					<p className="text-4xl mb-4">🏢</p>
					<p className="text-ink-2 font-medium mb-1">No hay organizaciones registradas</p>
					<p className="text-ink-3 text-sm mb-6">Crea la primera para empezar a asignar ligas</p>
					<Link
						href="/admin/organizations/new"
						className="bg-brand text-pitch px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dim"
					>
						Crear organización
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{organizations.map((org) => (
						<Link
							key={org.id}
							href={`/admin/organizations/${org.id}`}
							className="bg-surface rounded-xl shadow p-5 hover:shadow-md transition border border-line block"
						>
							<div className="flex items-start gap-3 mb-3">
								{org.logoUrl ? (
									<img
										src={org.logoUrl}
										alt={org.name}
										className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
									/>
								) : (
									<div className="w-10 h-10 rounded-lg bg-brand/15 flex items-center justify-center flex-shrink-0">
										<span className="text-brand font-bold text-lg">
											{org.name.charAt(0).toUpperCase()}
										</span>
									</div>
								)}
								<div className="min-w-0">
									<p className="font-semibold text-ink truncate">{org.name}</p>
									<p className="text-xs text-ink-3">
										{org.city} · /{org.slug}
									</p>
								</div>
							</div>
							<p className="text-xs text-brand font-medium">Ver organización →</p>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
