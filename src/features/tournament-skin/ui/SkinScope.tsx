/**
 * features/tournament-skin/ui/SkinScope.tsx
 *
 * Frontera visual del tema por torneo. Server-safe (sin "use client"): solo
 * pone data-skin en un div; el CSS de globals.css hace el resto en cascada.
 *
 * Uso en un módulo público (Server Component):
 *
 *   const skinId = await getActiveSkinId();
 *   return <SkinScope skinId={skinId}>…módulo tematizable…</SkinScope>;
 *
 * Con skinId null no emite el atributo → los tokens --color-skin-* quedan en
 * su default (paleta TalachaStats). Los componentes internos usan las
 * utilidades skin (bg-skin-surface, text-skin-primary-ink, border-skin-line…).
 */

import type { ReactNode } from "react";
import type { SkinId } from "@/shared/skins/registry";

type SkinScopeProps = {
	skinId: SkinId | null;
	children: ReactNode;
	className?: string;
};

export function SkinScope({ skinId, children, className }: SkinScopeProps) {
	return (
		<div data-skin={skinId ?? undefined} className={className}>
			{children}
		</div>
	);
}
