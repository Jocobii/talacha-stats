"use client";

/**
 * features/arranque-onboarding/ui/StepReady.tsx
 * Paso 4 — confirmación + CTAs hacia el wizard de equipos/jugadores o el panel.
 */

import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import type { CreatedLeagueView } from "../types";

type Props = { league: CreatedLeagueView };

export function StepReady({ league }: Props) {
	return (
		<Card className="p-8 flex flex-col items-center text-center gap-4">
			<div className="w-14 h-14 rounded-full bg-brand/15 grid place-items-center">
				<Check size={28} strokeWidth={3} className="text-brand-ink" />
			</div>
			<h3 className="font-display text-2xl text-ink font-bold tracking-tight">
				{league.name} ya tiene cancha y horario
			</h3>
			<p className="text-sm text-ink-2 max-w-sm">Ahora agrega equipos y jugadores.</p>

			<div className="flex items-center gap-3 mt-2">
				<Link href="/admin">
					<Button variant="secondary">Ir al panel</Button>
				</Link>
				<Link href={`/admin/leagues/${league.id}/setup`}>
					<Button variant="primary">Configurar equipos y jugadores</Button>
				</Link>
			</div>
		</Card>
	);
}
