"use client";

/**
 * features/import-excel/hooks/useColumnMapping.ts
 *
 * Estado y lógica del panel de mapeo de columnas del paso 2 del wizard.
 *
 * Responsabilidades:
 *   - Qué campo está activo (esperando que el usuario elija una columna)
 *   - Si el usuario ya interactuó (para mostrar el tutorial solo la primera vez)
 *   - Asignar una columna a un campo, desasignar, y auto-avanzar al siguiente
 *
 * Separado de useImportWizard para mantener alta cohesión:
 * esta lógica solo importa durante el paso "map".
 */

import { useState, useCallback } from "react";
import type { ColumnMap } from "../parser";
import type { FieldDefinition } from "../model";

export type UseColumnMappingReturn = {
	activeMapField: string | null;
	hasMapInteracted: boolean;
	handleFieldClick: (fieldKey: string) => void;
	handleColClick: (colIdx: number, columnMap: ColumnMap, fields: FieldDefinition[]) => ColumnMap;
	resetMapInteraction: () => void;
};

export function useColumnMapping(): UseColumnMappingReturn {
	const [activeMapField, setActiveMapField] = useState<string | null>(null);
	const [hasMapInteracted, setHasMapInteracted] = useState(false);

	/** Activa/desactiva un campo para asignación. */
	const handleFieldClick = useCallback((fieldKey: string) => {
		setActiveMapField((prev: string | null) => (prev === fieldKey ? null : fieldKey));
		setHasMapInteracted(true);
	}, []);

	/**
	 * Asigna la columna `colIdx` al campo activo actual.
	 * Si otra asignación usaba esa columna, la elimina primero.
	 * Auto-avanza al siguiente campo requerido sin asignar, o al siguiente
	 * campo sin asignar en general.
	 *
	 * Devuelve el nuevo columnMap resultante para que el caller pueda
	 * actualizar su estado de forma inmutable.
	 */
	const handleColClick = useCallback(
		(colIdx: number, columnMap: ColumnMap, fields: FieldDefinition[]): ColumnMap => {
			if (!activeMapField) return columnMap;

			// Nuevo mapa sin la columna que se va a reasignar
			const newMap: ColumnMap = Object.fromEntries(
				Object.entries(columnMap).filter(([, v]) => v !== String(colIdx)),
			);
			newMap[activeMapField] = String(colIdx);

			setHasMapInteracted(true);

			// Auto-avanzar al siguiente campo obligatorio sin asignar
			const nextRequired = fields.find(
				(f) => f.required && !newMap[f.key] && f.key !== activeMapField,
			);
			// Si no hay requeridos pendientes, avanzar al siguiente campo sin asignar
			const nextAny = fields.find((f) => !newMap[f.key] && f.key !== activeMapField);

			setActiveMapField(nextRequired?.key ?? nextAny?.key ?? null);

			return newMap;
		},
		[activeMapField],
	);

	/** Reinicia el estado de interacción (p.ej. al cambiar la fila header). */
	const resetMapInteraction = useCallback(() => {
		setActiveMapField(null);
		setHasMapInteracted(false);
	}, []);

	return {
		activeMapField,
		hasMapInteracted,
		handleFieldClick,
		handleColClick,
		resetMapInteraction,
	};
}
