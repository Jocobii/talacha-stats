import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getActiveCity } from "@/shared/lib/active-city";
import { getSessionUser } from "@/shared/lib/auth";
import AdminSidebar from "./AdminSidebar";
import TrialBanner from "./TrialBanner";

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const [activeCity, user] = await Promise.all([getActiveCity(), getSessionUser()]);

	// Full HMAC verification + DB lookup (middleware checks cookie presence only).
	if (!user) redirect("/login");

	// Organizers without an org must complete onboarding first.
	if (user.role === "organizer" && !user.organizationId) redirect("/onboarding");

	return (
		<div className="flex h-screen bg-gray-50 overflow-hidden">
			<AdminSidebar user={user} activeCity={activeCity} />

			{/* Right column: trial banner + scrollable content */}
			<div className="flex-1 flex flex-col min-h-0 pt-14 md:pt-0">
				<TrialBanner user={user} />
				<main className="flex-1 overflow-y-auto">
					<div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
				</main>
			</div>
		</div>
	);
}
