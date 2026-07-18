import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import {
	TYPOGRAPHY_VARIANTS,
	WEIGHT,
	TONE,
	type TypographyVariant,
	type Weight,
	type Tone,
} from "./typography-scales";

export type TypographyProps = Omit<HTMLAttributes<HTMLElement>, "color"> & {
	/** Resuelve tag semántico + tamaño + peso + fuente en un solo prop. Default `body`. */
	variant?: TypographyVariant;
	/** Sobreescribe el tag que renderiza el variant (ej. un `h2` visual dentro de un `<span>`). */
	as?: ElementType;
	/** Sobreescribe el peso por default del variant. */
	weight?: Weight;
	tone?: Tone;
	truncate?: boolean;
};

/** Único punto de tamaño/peso/tono/fuente de texto del proyecto. Reemplaza
 *  `text-[Npx]` y `style={{fontFamily:"var(--font-display)"}}` repetidos a mano.
 *  Uso: `<Typography variant="display">Título</Typography>`,
 *  `<Typography variant="bodySm" tone="ink-2">Meta</Typography>`. */
export function Typography({
	variant = "body",
	as,
	weight,
	tone = "ink",
	truncate = false,
	className,
	children,
	...rest
}: TypographyProps) {
	const preset = TYPOGRAPHY_VARIANTS[variant];
	const Tag = as ?? preset.as;

	return (
		<Tag
			className={cn(
				preset.className,
				weight && WEIGHT[weight],
				TONE[tone],
				truncate && "truncate",
				className,
			)}
			{...rest}
		>
			{children}
		</Tag>
	);
}
