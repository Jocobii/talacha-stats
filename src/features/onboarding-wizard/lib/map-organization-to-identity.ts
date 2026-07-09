/**
 * features/onboarding-wizard/lib/map-organization-to-identity.ts
 * Mapper puro DTO (Organization) → ViewModel (OrgIdentityView). Los pasos
 * Operación/Horario solo necesitan id/name/slug, no el registro completo de
 * Drizzle (status, verificationRequestedAt, etc. quedan fuera, §19).
 */

import { titleCase } from "@/shared/lib/normalize";
import type { OrgIdentityView } from "../types";

type OrganizationDto = { id: string; name: string; slug: string };

export function mapOrganizationToIdentity(org: OrganizationDto): OrgIdentityView {
	return {
		id: org.id,
		name: titleCase(org.name),
		slug: org.slug,
	};
}
