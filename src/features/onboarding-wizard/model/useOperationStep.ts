"use client";

/**
 * features/onboarding-wizard/model/useOperationStep.ts
 * Paso 2 (Operación): une el form de cancha y el de liga bajo un solo
 * "Continuar" (antes eran 2 pasos separados del wizard de Arranque). Dos
 * mutaciones independientes porque viven en endpoints distintos; si la
 * cancha ya existe (reanudación con `initialVenue`), no se vuelve a crear.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateVenueSchema, type CreateVenueInput } from "@/types";
import { useCreateVenueStep } from "./useCreateVenueStep";
import { useCreateLeagueStep } from "./useCreateLeagueStep";
import {
	OnboardingLeagueSchema,
	defaultSeason,
	type OnboardingLeagueInput,
} from "./onboarding-league-schema";
import type { CreatedVenueView, CreatedLeagueView } from "../types";

type Params = {
	organizationId: string;
	initialVenue: CreatedVenueView | null;
	onReady: (venue: CreatedVenueView, league: CreatedLeagueView) => void;
};

export function useOperationStep({ organizationId, initialVenue, onReady }: Params) {
	const venueForm = useForm<CreateVenueInput>({
		resolver: zodResolver(CreateVenueSchema),
		mode: "onBlur",
		defaultValues: { organizationId, name: "", capacity: 1, color: "#60A5FA" },
	});
	const leagueForm = useForm<OnboardingLeagueInput>({
		resolver: zodResolver(OnboardingLeagueSchema),
		mode: "onBlur",
		defaultValues: { name: "", season: defaultSeason(), dayOfWeek: "viernes", category: "" },
	});

	const createVenue = useCreateVenueStep(organizationId);
	const createLeague = useCreateLeagueStep();

	async function submit(): Promise<void> {
		const [venueValid, leagueValid] = await Promise.all([
			initialVenue ? Promise.resolve(true) : venueForm.trigger(),
			leagueForm.trigger(),
		]);
		if (!venueValid || !leagueValid) return;

		try {
			const venue = initialVenue ?? (await createVenue.mutateAsync(venueForm.getValues()));
			const league = await createLeague.mutateAsync(leagueForm.getValues());
			onReady(venue, league);
		} catch {
			// El error ya quedó expuesto vía createVenue.error / createLeague.error
			// (estado reactivo de TanStack Query, §7.2) — no hay nada más que hacer
			// aquí salvo evitar que la rejection se propague sin manejar.
		}
	}

	return {
		venueForm,
		leagueForm,
		submit,
		isPending: createVenue.isPending || createLeague.isPending,
		error: createVenue.error?.message || createLeague.error?.message || "",
	};
}
