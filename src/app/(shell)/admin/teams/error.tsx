"use client";

/**
 * app/admin/teams/error.tsx
 *
 * Error boundary de Next.js — wrapper delgado sobre shared/ui/ErrorState.
 * Espejo de app/admin/players/error.tsx.
 */

import { useEffect } from "react";
import { ErrorState } from "@/shared/ui/ErrorState";

export default function TeamsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[/admin/teams]", error);
	}, [error]);

	return <ErrorState onRetry={reset} />;
}
