"use client";

/**
 * features/venue-calendar/model/useRentalMutations.ts
 *
 * Mutaciones de rentas (crear, actualizar, borrar) con TanStack Query, sobre el
 * transporte ya existente (`lib/venue-calendar-api`). Reemplaza el manejo manual
 * de `isSaving`/`error` con `useState` + try/catch del hook del calendario (§7.2).
 *
 * La LECTURA de eventos la maneja FullCalendar (su propio motor de fetch por
 * rango), no TanStack Query — por eso aquí la "invalidación" es el `refetch` de
 * FC, que el caller inyecta vía `onSuccess`. Se usa `mutate` (no `mutateAsync`):
 * el error se expone vía `error`, sin `catch` que lo silencie (§18.4).
 */

import { useMutation } from "@tanstack/react-query";
import { createRental, updateRental, deleteRental } from "../lib/venue-calendar-api";
import type { CreateRentalPayload, UpdateRentalPayload } from "../types";

type UpdateVars = { id: string; payload: UpdateRentalPayload };
type MutateOptions = { onSuccess?: () => void; onError?: () => void };

export type RentalMutationsOptions = { onSuccess: () => void };

export type UseRentalMutationsReturn = {
	createRental: (payload: CreateRentalPayload, opts?: MutateOptions) => void;
	updateRental: (vars: UpdateVars, opts?: MutateOptions) => void;
	deleteRental: (id: string, opts?: MutateOptions) => void;
	isSaving: boolean;
	error: string | null;
};

export function useRentalMutations(
	venueId: string,
	{ onSuccess }: RentalMutationsOptions,
): UseRentalMutationsReturn {
	const createMutation = useMutation({
		mutationFn: (payload: CreateRentalPayload) => createRental(venueId, payload),
		onSuccess,
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, payload }: UpdateVars) => updateRental(id, payload),
		onSuccess,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteRental(id),
		onSuccess,
	});

	const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
	const error =
		createMutation.error?.message ??
		updateMutation.error?.message ??
		deleteMutation.error?.message ??
		null;

	return {
		createRental: (payload, opts) => createMutation.mutate(payload, opts),
		updateRental: (vars, opts) => updateMutation.mutate(vars, opts),
		deleteRental: (id, opts) => deleteMutation.mutate(id, opts),
		isSaving,
		error,
	};
}
