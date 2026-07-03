/**
 * features/tournament-skin/ui/SkinPreview.tsx
 *
 * Vista previa REAL de un skin: envuelve un mini-mockup de app en data-skin,
 * así pinta con los mismos tokens CSS que verá el público (globals.css). Si el
 * skin cambia en código, el preview cambia solo — no hay paleta duplicada en JS.
 *
 * `compact` = solo swatches (para filas de tabla).
 * Con skinId null o desconocido pinta la paleta TalachaStats (el default real).
 */

import { isSkinId } from "@/shared/skins/registry";

type SkinPreviewProps = {
	skinId: string | null;
	compact?: boolean;
	className?: string;
};

function scopeOf(skinId: string | null): string | undefined {
	if (!skinId) return undefined;
	return isSkinId(skinId) ? skinId : undefined;
}

function Swatches() {
	return (
		<span className="inline-flex items-center gap-1" aria-hidden>
			<span className="w-3.5 h-3.5 rounded-full bg-skin-primary border border-skin-line" />
			<span className="w-3.5 h-3.5 rounded-full bg-skin-accent border border-skin-line" />
			<span className="w-3.5 h-3.5 rounded-full bg-skin-surface-2 border border-skin-line" />
		</span>
	);
}

/** Mini "ventana de app" estilo GitHub theme picker, pintada con tokens skin. */
function ModuleMockup() {
	return (
		<div className="rounded-lg border border-skin-line overflow-hidden w-full" aria-hidden>
			{/* Barra superior: nav + swatches de acento */}
			<div className="bg-skin-surface-2 px-3 py-2 flex items-center gap-1.5">
				<span className="h-1.5 w-9 rounded-full bg-skin-line" />
				<span className="h-1.5 w-9 rounded-full bg-skin-line" />
				<span className="h-1.5 w-9 rounded-full bg-skin-line" />
				<span className="ml-auto inline-flex gap-1">
					<span className="w-2 h-2 rounded-[3px] bg-skin-primary" />
					<span className="w-2 h-2 rounded-[3px] bg-skin-accent" />
				</span>
			</div>
			{/* Contenido: título, barra destacada primaria, tarjetas */}
			<div className="bg-skin-surface p-3 space-y-2">
				<span className="block h-1.5 w-14 rounded-full bg-skin-line" />
				<span
					className="flex h-3.5 items-center rounded-full border px-1"
					style={{ background: "var(--tint-skin)", borderColor: "var(--tint-skin-bd)" }}
				>
					<span className="block h-1.5 w-2/3 rounded-full bg-skin-primary" />
				</span>
				<span className="flex gap-2">
					<span className="h-9 flex-1 rounded-md bg-skin-surface-2 border border-skin-line" />
					<span className="h-9 w-10 rounded-md bg-skin-surface-2 border border-skin-line" />
				</span>
			</div>
		</div>
	);
}

export function SkinPreview({ skinId, compact = false, className }: SkinPreviewProps) {
	return (
		<div data-skin={scopeOf(skinId)} className={className}>
			{compact ? <Swatches /> : <ModuleMockup />}
		</div>
	);
}
