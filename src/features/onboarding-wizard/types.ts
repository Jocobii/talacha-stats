/**
 * features/onboarding-wizard/types.ts
 * Tipos compartidos del wizard de onboarding unificado. No duplicar en
 * subcomponentes.
 */

/** Identidad → Operación → Horario. El "Listo" final vive fuera del stepper
 *  (ver useOnboardingWizard.isComplete), igual que el mockup de referencia. */
export type OnboardingStep = 0 | 1 | 2;

/** ViewModel de la organización recién creada — lo mínimo que necesitan los
 *  pasos siguientes (Operación crea cancha/liga scoped a esta org). */
export type OrgIdentityView = {
	id: string;
	name: string;
	slug: string;
};

/** ViewModel de la cancha registrada en el paso Operación. */
export type CreatedVenueView = {
	id: string;
	name: string;
	color: string;
};

/** ViewModel de la liga creada en el paso Operación — incluye dayOfWeek: el
 *  horario del paso 3 lo hereda. */
export type CreatedLeagueView = {
	id: string;
	name: string;
	dayOfWeek: string;
	season: string;
};

/** Estado del chequeo de disponibilidad de slug en tiempo real. */
export type SlugCheckStatus = "idle" | "checking" | "available" | "taken" | "invalid";

/** Espejo estructural de OrgStyleValue (features/org-theming/ui/OrgStyleStep)
 *  — mismo shape, sin importar el tipo de una feature ajena en este archivo
 *  compartido (que también consume `app`, capa server). */
export type StyleDraft = { presetId: string | null; fontId: string };

/** Snapshot en vivo del paso Identidad ANTES de crear la organización — lo
 *  usa el aside de preview para reflejar cada tecleo (§ no hay "org" real
 *  hasta que el paso 1 se envía con éxito). */
export type DraftIdentity = {
	name: string;
	slug: string;
	logoUrl: string;
	style: StyleDraft;
};

/** Ventana horaria confirmada en el paso Horario — se necesita en la
 *  pantalla final (chip "7:00 PM–9:00 PM", bloque "próxima jornada"). */
export type ScheduleDraft = {
	startTime: string;
	endTime: string;
};
