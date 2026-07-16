"use client";

/**
 * shared/ui/filters/SelectControl.tsx
 *
 * Select simple para FilterBar — aplica al elegir. Soporta estado
 * deshabilitado (para selects dependientes, ej. Equipo depende de Liga) y
 * loading (skeleton mientras cargan las opciones dinámicas).
 *
 * Wrapper delgado sobre shared/ui/Listbox (panel de opciones custom, no
 * <select> nativo) — mantiene esta API (value/onApply) para no tocar a
 * los consumidores existentes.
 */

import { Listbox } from "../Listbox";
import type { FilterOption } from "./MultiSelectControl";

export function SelectControl({
	value,
	onApply,
	options,
	placeholder,
	disabled,
	loading,
	className,
}: {
	value: string;
	onApply: (value: string) => void;
	options: FilterOption[];
	placeholder?: string;
	disabled?: boolean;
	loading?: boolean;
	className?: string;
}) {
	return (
		<Listbox
			value={value}
			onChange={onApply}
			options={options}
			placeholder={placeholder}
			disabled={disabled}
			loading={loading}
			className={className}
		/>
	);
}
