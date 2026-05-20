"use client";

/**
 * features/admin-registration/ui/RegistrationErrorCard.tsx
 * Estado: error — muestra mensaje y botón de reintento.
 */

import { AlertCircle } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

type Props = {
	message: string;
	onRetry: () => void;
};

export function RegistrationErrorCard({ message, onRetry }: Props) {
	return (
		<Card className="overflow-hidden">
			<div className="flex items-center gap-2 px-6 py-3 border-b border-line bg-red-500/[0.06]">
				<AlertCircle size={14} strokeWidth={2} className="text-red-400" />
				<span className="text-[12px] font-semibold text-red-400">Error</span>
			</div>
			<div className="p-6 flex items-center justify-between gap-4">
				<p className="text-sm text-ink-2">{message}</p>
				<Button variant="secondary" size="sm" onClick={onRetry}>
					Intentar de nuevo
				</Button>
			</div>
		</Card>
	);
}
