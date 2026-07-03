/**
 * entities/organization/theme-queries.ts
 *
 * Acceso a datos del tema visual de una organización (docs/ORG-THEMING.md §2).
 * Solo lectura/escritura cruda — la resolución a tokens vive en
 * features/org-theming (frontera de confianza DB → catálogo en código).
 */

import { db } from "@/db";
import {
	organizations,
	organizationThemes,
	type NewOrganizationTheme,
	type OrganizationTheme,
} from "@/db/schema";
import { eq } from "drizzle-orm";

/** Tema de una org por slug público. null = sin tema configurado (fallback brand). */
export async function findOrgThemeBySlug(slug: string): Promise<OrganizationTheme | null> {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
		columns: { id: true },
		with: { theme: true },
	});
	return org?.theme ?? null;
}

/** Tema por id de organización (panel admin). */
export async function findOrgThemeByOrgId(
	organizationId: string,
): Promise<OrganizationTheme | null> {
	const row = await db.query.organizationThemes.findFirst({
		where: eq(organizationThemes.organizationId, organizationId),
	});
	return row ?? null;
}

/** Crea o actualiza el tema de una org (1:1 — upsert por organization_id).
 *  El caller (server action) ya validó con Zod; los CHECKs de DB son la red final. */
export async function upsertOrgTheme(
	organizationId: string,
	values: Omit<NewOrganizationTheme, "id" | "organizationId" | "updatedAt">,
): Promise<OrganizationTheme> {
	const [row] = await db
		.insert(organizationThemes)
		.values({ ...values, organizationId })
		.onConflictDoUpdate({
			target: organizationThemes.organizationId,
			set: { ...values, updatedAt: new Date() },
		})
		.returning();
	return row;
}
