/**
 * ─────────────────────────────────────────────────────────────────
 *  TalachaStats — Estándar de iconografía
 * ─────────────────────────────────────────────────────────────────
 *
 *  LIBRERÍA BASE: lucide-react
 *
 *  ┌─ STROKE WIDTH ─────────────────────────────────────────────┐
 *  │  strokeWidth={2}  → estándar universal                     │
 *  │                                                            │
 *  │  Por qué 2 y no 2.5: el fondo oscuro (#0A0A0A) hace que   │
 *  │  los trazos se lean bien con menos peso. 2.5 en dark       │
 *  │  resulta visualmente pesado. 2 da el balance técnico       │
 *  │  preciso que corresponde a una app de estadísticas.        │
 *  └────────────────────────────────────────────────────────────┘
 *
 *  ┌─ TAMAÑOS (size) ───────────────────────────────────────────┐
 *  │  xs  = 12px  → inline en texto, badges, metadatos         │
 *  │  sm  = 16px  → botones, acciones compactas                │
 *  │  md  = 20px  → navegación, cards, default                 │
 *  │  lg  = 24px  → iconos de feature, section headers         │
 *  │                                                            │
 *  │  Nunca usar valores fuera de esta escala.                  │
 *  └────────────────────────────────────────────────────────────┘
 *
 *  ┌─ COLOR (className) ────────────────────────────────────────┐
 *  │  text-brand   #00E676  → activo, primario, énfasis        │
 *  │  text-ink-2   #999999  → reposo, nav inactivo             │
 *  │  text-ink-3   #555555  → sutil, decorativo, deshabilitado │
 *  │  text-ink     #F5F5F5  → sobre superficies de color       │
 *  │  text-pitch   #0A0A0A  → sobre fondo brand (btn verde)    │
 *  └────────────────────────────────────────────────────────────┘
 *
 *  ┌─ CONTENEDORES ─────────────────────────────────────────────┐
 *  │  <IconBox>          → surface-2 + borde line (neutro)     │
 *  │  <IconBox accent>   → brand/10 + borde brand/20 (activo)  │
 *  └────────────────────────────────────────────────────────────┘
 *
 *  ┌─ REGLAS GENERALES ─────────────────────────────────────────┐
 *  │  • Nunca usar fill en iconos Lucide (siempre outline)      │
 *  │  • No mezclar tamaños en el mismo contexto UI              │
 *  │  • Nav siempre md (20px)                                   │
 *  │  • Botones siempre sm (16px)                               │
 *  │  • Features / cards siempre lg (24px)                      │
 *  └────────────────────────────────────────────────────────────┘
 *
 *  USO:
 *    import { IconBox } from "@/shared/ui/Icon";
 *    import { Trophy } from "lucide-react";
 *
 *    // Icono suelto
 *    <Trophy size={20} strokeWidth={2} className="text-brand" />
 *
 *    // Icono en contenedor neutro
 *    <IconBox><Trophy /></IconBox>
 *
 *    // Icono en contenedor con acento verde
 *    <IconBox accent><Trophy /></IconBox>
 * ─────────────────────────────────────────────────────────────────
 */

import { type ReactNode } from "react";

/** Escala canónica de tamaños */
export const ICON_SIZE = {
	xs: 12, // inline en texto, badges
	sm: 16, // botones, acciones compactas
	md: 20, // navegación, cards (default)
	lg: 24, // features, section headers
} as const;

export type IconSize = keyof typeof ICON_SIZE;

/** strokeWidth universal */
export const ICON_STROKE = 2;

/* ─────────────────────────────────────────────────────────────────
   IconBox — contenedor decorativo para iconos de feature/card
───────────────────────────────────────────────────────────────── */
type IconBoxProps = {
	children: ReactNode;
	/** true → fondo verde tenue + borde brand  |  false → fondo surface-2 + borde line */
	accent?: boolean;
	/** Tamaño del cuadro. Por defecto "md" (40px) */
	size?: "sm" | "md" | "lg";
};

const BOX_SIZE = {
	sm: "w-8 h-8 rounded-lg",
	md: "w-10 h-10 rounded-xl",
	lg: "w-12 h-12 rounded-xl",
} as const;

export function IconBox({ children, accent = false, size = "md" }: IconBoxProps) {
	return (
		<div
			className={[
				BOX_SIZE[size],
				"flex items-center justify-center shrink-0",
				accent
					? "bg-brand/10 border border-brand/20 text-brand"
					: "bg-surface-2 border border-line text-ink-2",
			].join(" ")}
		>
			{children}
		</div>
	);
}
