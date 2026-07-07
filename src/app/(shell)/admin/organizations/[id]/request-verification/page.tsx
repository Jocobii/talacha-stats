import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import { getOrganizationById } from "@/entities/organization";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
	params: Promise<{ id: string }>;
}

// Server Component — runs the update directly and redirects back to admin.
// Triggered by the CTA link in TrialBanner.
export default async function RequestVerificationPage({ params }: PageProps) {
	const { id } = await params;
	const user = await getSessionUser();

	if (!user) redirect("/login");
	if (user.role !== "owner" && user.organizationId !== id) redirect("/admin");

	const org = await getOrganizationById(id);

	// Guard: skip if already verified or already requested
	if (!org || org.status === "verified" || org.verificationRequestedAt) {
		redirect("/admin");
	}

	await db
		.update(organizations)
		.set({ verificationRequestedAt: new Date() })
		.where(eq(organizations.id, id));

	redirect("/admin");
}
