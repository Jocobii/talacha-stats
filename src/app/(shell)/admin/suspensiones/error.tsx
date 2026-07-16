"use client";

/**
 * app/admin/suspensiones/error.tsx
 *
 * Error boundary de Next.js — wrapper delgado sobre shared/ui/ErrorState.
 * Espejo de app/admin/players/error.tsx.
 */

import { useEffect } from "react";
import { ErrorState } from "@/shared/ui/ErrorState";

export default function SuspensionesError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[/admin/suspensiones]", error);
	}, [error]);

	return <ErrorState onRetry={reset} />;
}
