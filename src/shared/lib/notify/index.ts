/**
 * shared/lib/notify
 *
 * Facade único de notificaciones. Envuelve `sileo` (toast físico con SVG
 * morphing) detrás de una API simple y estable. NADIE en la app debe importar
 * `sileo` directamente: siempre vía este módulo. Así el día que se cambie de
 * librería, solo se toca este archivo.
 *
 * Uso:
 *   import { notify } from "@/shared/lib/notify";
 *
 *   notify.success("Guardado correctamente");
 *   notify.error("Algo salió mal");
 *   notify.warning({ title: "Cuidado", description: "Quedan 2 lugares" });
 *
 *   // Con botón de acción:
 *   notify.action("Equipo eliminado", { label: "Deshacer", onClick: undo });
 *
 *   // Atado a una promesa (loading → success/error):
 *   await notify.promise(guardar(), {
 *     loading: "Guardando…",
 *     success: "Listo",
 *     error: "No se pudo guardar",
 *   });
 *
 * El Toaster se monta una sola vez en el root layout (ver shared/ui/Toaster).
 */
import { sileo, type SileoOptions } from "sileo";
import { NotifyCloseIcon } from "./NotifyCloseIcon";
import type {
	NotifyAction,
	NotifyBranch,
	NotifyIconState,
	NotifyId,
	NotifyInput,
	NotifyOptions,
	NotifyPosition,
	NotifyPromiseOptions,
} from "./notify.types";

export type {
	NotifyAction,
	NotifyInput,
	NotifyOptions,
	NotifyPosition,
	NotifyPromiseOptions,
} from "./notify.types";

/**
 * Duraciones por defecto (ms) por tipo, para conservar la UX previa.
 * Los errores viven un poco más porque suelen requerir lectura.
 */
const DEFAULT_DURATION = {
	success: 4000,
	error: 5000,
	warning: 4000,
	info: 4000,
} as const;

/** Normaliza `string | NotifyOptions` → `NotifyOptions`. */
function toOptions(input: NotifyInput): NotifyOptions {
	return typeof input === "string" ? { title: input } : input;
}

/**
 * El ícono del badge (✓ / ✕ / ⚠) por default de sileo es solo estado visual
 * — no cierra nada, y el toast solo se cierra por timeout o con swipe
 * (arrastrar >30px verticalmente), nunca con un click plano. En vez de sumar
 * un botón "Cerrar" aparte (se veía fuera de lugar dentro del toast), el
 * mismo ícono de estado SE VUELVE el cierre: mismo glyph, mismo color,
 * clickeable (ver NotifyCloseIcon). `sileo.success/error/...` devuelve el id
 * de forma síncrona, así que lo capturamos en una caja mutable — el
 * `onClick` del ícono solo se ejecuta al hacer click, momento en el que la
 * caja ya tiene el id (§18.4: no tragamos el caso `id` ausente, solo no-op).
 * Si el caller ya pasó su propio `icon`, no lo pisamos.
 */
function withDismissIcon(
	opts: NotifyOptions,
	state: NotifyIconState,
): { opts: NotifyOptions; idBox: { id?: NotifyId } } {
	if (opts.icon) return { opts, idBox: {} };
	const idBox: { id?: NotifyId } = {};
	return {
		opts: {
			...opts,
			icon: NotifyCloseIcon({
				state,
				onDismiss: () => {
					if (idBox.id) sileo.dismiss(idBox.id);
				},
			}),
		},
		idBox,
	};
}

/** Traduce nuestras opciones al shape que espera `sileo`. */
function toSileo(opts: NotifyOptions, fallbackDuration: number): SileoOptions {
	const { action, duration, ...rest } = opts;
	return {
		...rest,
		duration: duration === undefined ? fallbackDuration : duration,
		...(action ? { button: { title: action.label, onClick: action.onClick } } : {}),
	};
}

/** Resuelve una rama estática o callback de `notify.promise`. */
function resolveBranch<T>(branch: NotifyBranch<T>, value: T): SileoOptions {
	const input = typeof branch === "function" ? branch(value) : branch;
	// El tipo dentro de promise no lleva fallback propio; sileo usa su default.
	const opts = toOptions(input);
	const { action, ...rest } = opts;
	return {
		...rest,
		...(action ? { button: { title: action.label, onClick: action.onClick } } : {}),
	};
}

export const notify = {
	success: (input: NotifyInput): NotifyId => {
		const { opts, idBox } = withDismissIcon(toOptions(input), "success");
		return (idBox.id = sileo.success(toSileo(opts, DEFAULT_DURATION.success)));
	},

	error: (input: NotifyInput): NotifyId => {
		const { opts, idBox } = withDismissIcon(toOptions(input), "error");
		return (idBox.id = sileo.error(toSileo(opts, DEFAULT_DURATION.error)));
	},

	warning: (input: NotifyInput): NotifyId => {
		const { opts, idBox } = withDismissIcon(toOptions(input), "warning");
		return (idBox.id = sileo.warning(toSileo(opts, DEFAULT_DURATION.warning)));
	},

	info: (input: NotifyInput): NotifyId => {
		const { opts, idBox } = withDismissIcon(toOptions(input), "info");
		return (idBox.id = sileo.info(toSileo(opts, DEFAULT_DURATION.info)));
	},

	/** Notificación con botón de acción (p. ej. "Deshacer"). */
	action: (input: NotifyInput, action: NotifyAction): NotifyId => {
		const opts = toOptions(input);
		return sileo.action(toSileo({ ...opts, action }, DEFAULT_DURATION.info));
	},

	/** Atado a una promesa: muestra loading y resuelve a success/error. */
	promise: <T>(promise: Promise<T>, opts: NotifyPromiseOptions<T>): Promise<T> =>
		sileo.promise(promise, {
			loading: resolveBranch<T>(opts.loading, undefined as T),
			success: (data: T) => resolveBranch(opts.success, data),
			error: (err: unknown) => resolveBranch(opts.error, err),
			...(opts.position ? { position: opts.position } : {}),
		}),

	/** Cierra una notificación por id. */
	dismiss: (id: NotifyId): void => sileo.dismiss(id),

	/** Cierra todas, o solo las de una posición. */
	clear: (position?: NotifyPosition): void => sileo.clear(position),
};

export type Notify = typeof notify;
