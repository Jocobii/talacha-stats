"use client";

/**
 * features/admin-registration/ui/CurpSearchCard.tsx
 * Estado inicial: input CURP grande + selector de liga.
 */

import { forwardRef } from "react";
import { Loader2, Search, IdCard } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { KeyHint } from "@/shared/ui/KeyHint";
import { SectionLabel } from "@/shared/ui/SectionLabel";

type Props = {
	curp: string;
	onCurpChange: (val: string) => void;
	isSearching: boolean;
};

export const CurpSearchCard = forwardRef<HTMLInputElement, Props>(function CurpSearchCard(
	{ curp, onCurpChange, isSearching },
	ref,
) {
	return (
		<Card className="p-7 sm:p-8">
			<div className="max-w-[560px]">
				<SectionLabel>Paso 1 &middot; Buscar</SectionLabel>
				<h2 className="font-display text-[28px] text-ink font-bold tracking-tight mt-1">
					CURP del jugador
				</h2>
				<p className="text-sm text-ink-2 mt-1.5">
					Escribe los 18 caracteres. Buscamos automáticamente al completar.
				</p>

				<div className="mt-6">
					<div className="relative">
						<input
							ref={ref}
							value={curp}
							onChange={(e) => onCurpChange(e.target.value)}
							placeholder="AAAA000000HXXXXXX0"
							maxLength={18}
							autoComplete="off"
							autoFocus
							className="w-full h-14 rounded-md bg-surface-2 border border-line pl-12 pr-32 text-[18px] tracking-[0.18em] font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition"
						/>
						<span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none">
							{isSearching ? (
								<Loader2 size={20} className="animate-spin text-brand-ink" />
							) : (
								<IdCard size={20} strokeWidth={1.75} />
							)}
						</span>
						<span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
							<span className="text-[11px] font-mono text-ink-3">{curp.length}/18</span>
							<KeyHint>&#8629;</KeyHint>
						</span>
					</div>
					<div className="mt-2.5 flex items-center justify-between">
						<span className="text-[12px] text-ink-3 flex items-center gap-1.5">
							<Search size={12} strokeWidth={1.75} />
							Se busca automáticamente al completar
						</span>
					</div>
				</div>
			</div>
		</Card>
	);
});
