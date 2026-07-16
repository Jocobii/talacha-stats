"use client";

/**
 * shared/ui/ErrorState.tsx
 *
 * Estado de error genérico — mensaje claro + reintentar. Pensado para
 * error.tsx de cualquier ruta (boundary de Next.js pasa `reset` como
 * callback) pero reutilizable en cualquier otro lugar que necesite el mismo
 * patrón visual.
 */

import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorState({
	title = "No pudimos cargar los datos",
	description = "Hubo un problema de conexión con el servidor.",
	retryLabel = "Reintentar",
	onRetry,
}: {
	title?: string;
	description?: string;
	retryLabel?: string;
	onRetry?: () => void;
}) {
	return (
		<div className="border border-red-500/20 rounded-lg bg-red-500/[0.04] px-6 py-16 text-center">
			<div className="w-11 h-11 rounded-md bg-red-500/10 border border-red-500/20 mx-auto mb-4 grid place-items-center text-red-400">
				<AlertCircle size={19} strokeWidth={1.6} />
			</div>
			<h3 className="font-display text-xl font-bold text-ink tracking-tight">{title}</h3>
			<p className="mt-1.5 text-sm text-ink-2 max-w-sm mx-auto">{description}</p>
			{onRetry && (
				<div className="mt-5 inline-flex">
					<button
						type="button"
						onClick={onRetry}
						className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-surface-2 border border-line text-ink text-sm hover:border-ink-3 transition"
					>
						<RefreshCw size={15} strokeWidth={1.75} /> {retryLabel}
					</button>
				</div>
			)}
		</div>
	);
}
