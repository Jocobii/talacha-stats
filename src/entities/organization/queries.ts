import { db } from "@/db";
import { organizations, users, leagues } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "./model";

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

/** Obtiene una organización por su ID. */
export async function getOrganizationById(id: string) {
	return db.query.organizations.findFirst({
		where: eq(organizations.id, id),
	});
}

/** Obtiene una organización por su slug (para URLs públicas). */
export async function getOrganizationBySlug(slug: string) {
	return db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});
}

/** Lista todas las organizaciones del sistema (solo para owner). */
export async function listOrganizations() {
	return db.query.organizations.findMany({
		orderBy: [asc(organizations.name)],
	});
}

/** Obtiene la organización de un usuario específico. */
export async function getOrganizationByUserId(userId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		with: { organization: true },
	});
	return user?.organization ?? null;
}

/** Obtiene una organización con sus ligas y miembros. */
export async function getOrganizationWithDetails(id: string) {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, id),
		with: {
			leagues: {
				orderBy: (l, { asc }) => [asc(l.name)],
			},
			members: {
				columns: {
					id: true,
					name: true,
					email: true,
					role: true,
					active: true,
					createdAt: true,
				},
				orderBy: (u, { asc }) => [asc(u.name)],
			},
		},
	});
	return org ?? null;
}

/** Lista los usuarios que pertenecen a una organización. */
export async function getUsersByOrganization(organizationId: string) {
	return db.query.users.findMany({
		where: eq(users.organizationId, organizationId),
		columns: {
			id: true,
			name: true,
			email: true,
			role: true,
			active: true,
			createdAt: true,
		},
		orderBy: [asc(users.name)],
	});
}

/** Lista las ligas de una organización. */
export async function getLeaguesByOrganization(organizationId: string) {
	return db.query.leagues.findMany({
		where: eq(leagues.organizationId, organizationId),
		with: { teams: true },
		orderBy: (l, { desc }) => [desc(l.createdAt)],
	});
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

/** Crea una nueva organización. */
export async function createOrganization(
	input: CreateOrganizationInput,
): Promise<typeof organizations.$inferSelect> {
	const [org] = await db
		.insert(organizations)
		.values({
			name: input.name,
			slug: input.slug,
			logoUrl: input.logoUrl,
			city: input.city,
		})
		.returning();
	return org;
}

/** Actualiza una organización existente. */
export async function updateOrganization(
	id: string,
	input: UpdateOrganizationInput,
): Promise<typeof organizations.$inferSelect | null> {
	const [updated] = await db
		.update(organizations)
		.set({
			...(input.name !== undefined && { name: input.name }),
			...(input.slug !== undefined && { slug: input.slug }),
			...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
			...(input.city !== undefined && { city: input.city }),
		})
		.where(eq(organizations.id, id))
		.returning();
	return updated ?? null;
}

/** Elimina una organización. Solo debería usarse si no tiene ligas activas. */
export async function deleteOrganization(id: string): Promise<boolean> {
	const result = await db
		.delete(organizations)
		.where(eq(organizations.id, id))
		.returning({ id: organizations.id });
	return result.length > 0;
}

/** Asigna un usuario a una organización (o lo desvincula con null). */
export async function setUserOrganization(
	userId: string,
	organizationId: string | null,
): Promise<void> {
	await db
		.update(users)
		.set({ organizationId })
		.where(eq(users.id, userId));
}
