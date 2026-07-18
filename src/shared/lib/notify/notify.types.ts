/**
 * shared/lib/notify/notify.types.ts
 *
 * Tipos públicos del facade de notificaciones. Son un subconjunto estable
 * y propio del proyecto: NO exponemos los tipos de `sileo` al resto de la app
 * para mantener la dependencia desacoplada (un solo punto de cambio si se
 * reemplaza la librería). Ver AGENTS.md §8.1 (minimizar superficie de deps).
 */
import type { ReactNode } from "react";

export type NotifyPosition =
	| "top-left"
	| "top-center"
	| "top-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right";

/** Botón de acción opcional dentro de una notificación. */
export type NotifyAction = {
	label: string;
	onClick: () => void;
};

/** Opciones completas para emitir una notificación. */
export type NotifyOptions = {
	/** Título / mensaje principal. */
	title: string;
	/** Cuerpo opcional (texto o JSX). */
	description?: ReactNode;
	/** ms hasta auto-cerrar. `null` = permanente hasta dismiss manual. */
	duration?: number | null;
	/** Sobrescribe la posición por defecto del Toaster para esta notificación. */
	position?: NotifyPosition;
	/** Ícono personalizado en el badge. */
	icon?: ReactNode;
	/** Botón de acción opcional. */
	action?: NotifyAction;
};

/**
 * Entrada flexible: pasa un `string` para el caso común
 * (`notify.success("Guardado")`) o un objeto para casos ricos.
 */
export type NotifyInput = string | NotifyOptions;

/** Identificador devuelto al emitir una notificación; sirve para `dismiss`. */
export type NotifyId = string;

/** Una rama de `notify.promise`: estática o derivada del valor resuelto/rechazado. */
export type NotifyBranch<T> = NotifyInput | ((value: T) => NotifyInput);

/** Estados con ícono propio — usado por `NotifyCloseIcon` para elegir el glyph. */
export type NotifyIconState = "success" | "error" | "warning" | "info";

export type NotifyPromiseOptions<T> = {
	loading: NotifyInput;
	success: NotifyBranch<T>;
	error: NotifyBranch<unknown>;
	position?: NotifyPosition;
};
