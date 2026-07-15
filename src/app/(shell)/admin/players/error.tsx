"use client";

/**
 * app/admin/players/error.tsx
 *
 * Error boundary de Next.js — wrapper delgado sobre shared/ui/ErrorState.
 */

import { useEffect } from "react";
import { ErrorState } from "@/shared/ui/ErrorState";

export default function PlayersError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[/admin/players]", error);
	}, [error]);

	return <ErrorState onRetry={reset} />;
}
