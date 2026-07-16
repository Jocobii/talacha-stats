/**
 * shared/ui/filters/ActiveChip.tsx
 *
 * Chip de filtro activo, removible. Server-renderable: la remoción es
 * navegación a un href sin ese parámetro (no necesita "use client").
 */

import Link from "next/link";
import { X } from "lucide-react";

export function ActiveChip({ label, href }: { label: string; href: string }) {
	return (
		<Link
			href={href}
			className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full bg-brand/10 border border-brand/25 text-[12px] font-medium text-brand-ink hover:bg-brand/15 transition"
		>
			{label}
			<span className="w-4 h-4 grid place-items-center rounded-full">
				<X size={11} strokeWidth={2.5} />
			</span>
		</Link>
	);
}
