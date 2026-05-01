import Link from "next/link";
import { getOrganizationById } from "@/entities/organization";
import type { SessionUser } from "@/shared/lib/auth";

interface TrialBannerProps {
	user: SessionUser;
}

export default async function TrialBanner({ user }: TrialBannerProps) {
	// Only organizers tied to an org can be in trial
	if (user.role === "owner" || !user.organizationId) return null;

	const org = await getOrganizationById(user.organizationId);
	if (!org || org.status !== "trial") return null;

	const alreadyRequested = Boolean(org.verificationRequestedAt);

	return (
		<div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
			<div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
				<div className="flex items-center gap-2 min-w-0">
					<span className="text-amber-600 text-sm">⚠️</span>
					<p className="text-sm text-amber-800">
						<strong>{org.name}</strong> esta en modo trial — tus datos no aparecen en los rankings
						publicos todavia.
					</p>
				</div>
				{alreadyRequested ? (
					<span className="shrink-0 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
						Verificacion solicitada ✓
					</span>
				) : (
					<Link
						href={`/admin/organizations/${org.id}/request-verification`}
						className="shrink-0 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition"
					>
						Solicitar verificacion
					</Link>
				)}
			</div>
		</div>
	);
}
