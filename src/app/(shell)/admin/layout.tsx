import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getSessionUser, redirectToLogin } from "@/shared/lib/auth";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const user = await getSessionUser();

	// Full HMAC verification + DB lookup (middleware checks cookie presence only).
	if (!user) redirectToLogin();

	// Organizers without an org must complete onboarding first.
	if (user.role === "organizer" && !user.organizationId) redirect("/onboarding");

	return (
		<AdminSidebar>
			<div className="flex-1 flex flex-col min-h-0 pt-14 md:pt-0 bg-pitch">
				<main>{children}</main>
			</div>
		</AdminSidebar>
	);
}
