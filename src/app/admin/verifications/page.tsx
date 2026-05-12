import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/shared/lib/auth";
import { listPendingVerifications } from "@/entities/organization";
import type { PendingVerification } from "@/entities/organization";
import ApproveButton from "./ApproveButton";

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("es-MX", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

function VerificationRow({ org }: { org: PendingVerification }) {
	return (
		<div className="bg-surface rounded-xl border border-line p-5 flex flex-col sm:flex-row sm:items-center gap-4">
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<h3 className="font-bold text-ink truncate">{org.name}</h3>
					<span className="shrink-0 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
						trial
					</span>
				</div>
				<p className="text-sm text-ink-2">
					{org.city} &middot; <span className="font-mono text-xs text-ink-3">{org.slug}</span>
				</p>
				{org.organizer && (
					<p className="text-sm text-ink-2 mt-1">
						<span className="font-medium">{org.organizer.name}</span>
						{" — "}
						<a href={`mailto:${org.organizer.email}`} className="text-brand hover:underline">
							{org.organizer.email}
						</a>
					</p>
				)}
				<p className="text-xs text-ink-3 mt-1">
					Solicitado: {formatDate(org.verificationRequestedAt)}
				</p>
			</div>
			<ApproveButton orgId={org.id} orgName={org.name} />
		</div>
	);
}

export default async function VerificationsPage() {
	const user = await getSessionUser();
	if (!user) redirect("/login");
	if (user.role !== "owner") redirect("/admin");

	const pending = await listPendingVerifications();

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-ink">Verificaciones pendientes</h1>
					<p className="text-sm text-ink-3 mt-0.5">
						{pending.length === 0
							? "Sin solicitudes pendientes"
							: `${pending.length} solicitud${pending.length !== 1 ? "es" : ""} pendiente${pending.length !== 1 ? "s" : ""}`}
					</p>
				</div>
				<Link href="/admin" className="text-sm text-ink-2 hover:text-ink">
					&larr; Volver al panel
				</Link>
			</div>

			{pending.length === 0 ? (
				<div className="bg-surface rounded-xl border border-line p-12 text-center">
					<p className="text-4xl mb-3">✅</p>
					<p className="font-medium text-ink">Todo al dia</p>
					<p className="text-sm text-ink-3 mt-1">No hay organizaciones esperando verificacion.</p>
				</div>
			) : (
				<div className="space-y-3">
					{pending.map((org) => (
						<VerificationRow key={org.id} org={org} />
					))}
				</div>
			)}
		</div>
	);
}
