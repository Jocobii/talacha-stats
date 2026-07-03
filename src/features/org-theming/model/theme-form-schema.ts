/**
 * features/org-theming/model/theme-form-schema.ts
 *
 * Schema Zod ÚNICO del tema (§7.2): valida el form (cliente) y el API route
 * (safeParse). Client-safe: sin imports de @/db.
 *
 * El refine de contraste rechaza combinaciones custom ilegibles — el preview
 * ya se lo advirtió al usuario en vivo (reportThemeContrast); el server no
 * corrige en silencio: rechaza, para que lo guardado sea lo que se ve.
 */

import { z } from "zod";
import { HEX_COLOR_REGEX, ORG_FONT_IDS, ORG_PRESET_IDS, contrastRatio } from "@/shared/org-theme";

const hexColor = z
	.string()
	.trim()
	.toLowerCase()
	.regex(HEX_COLOR_REGEX, "Color inválido — usa formato #rrggbb");

const fontId = z.enum(ORG_FONT_IDS, { error: "Elige una tipografía del catálogo" });

export const ThemeFormSchema = z.discriminatedUnion("mode", [
	z.object({
		mode: z.literal("preset"),
		presetId: z.enum(ORG_PRESET_IDS, { error: "Elige una paleta del catálogo" }),
		fontId,
	}),
	z
		.object({
			mode: z.literal("custom"),
			colorPrimary: hexColor,
			colorAccent: hexColor,
			colorSurface: hexColor,
			colorInk: hexColor,
			fontId,
		})
		.refine((v) => contrastRatio(v.colorInk, v.colorSurface) >= 4.5, {
			message: "El texto no contrasta suficiente con el fondo (mínimo 4.5:1 — WCAG AA)",
			path: ["colorInk"],
		}),
]);

export type ThemeFormInput = z.infer<typeof ThemeFormSchema>;
