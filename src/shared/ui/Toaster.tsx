"use client";
/**
 * shared/ui/Toaster.tsx
 *
 * Punto de montaje único de las notificaciones (sileo). Va una sola vez en el
 * root layout — NO lo pongas por página. Las notificaciones se emiten desde
 * cualquier lugar con `notify.*` (ver shared/lib/notify); este componente solo
 * fija los defaults visuales del proyecto.
 *
 * Es un Client Component porque sileo monta estado/portales en el navegador.
 */
import { Toaster as SileoToaster } from "sileo";
// Estilos requeridos por sileo (position:fixed del viewport + animaciones de
// entrada/salida). Sin este import el toast se monta en el DOM pero cae en
// flujo normal del documento — invisible en la práctica. No se estaba
// importando en ningún lado del proyecto (bug real detrás de "no muestra nada").
import "sileo/styles.css";

/**
 * Defaults del proyecto: esquina superior-derecha, fondo de card de marca
 * (`--color-surface-2`) y radio consistente con `.surface-card` (§7.2a).
 * No usamos el prop `theme` de sileo: su semántica light/dark controla el
 * fill vía una paleta genérica propia (no la de la app) y queda invertida
 * respecto a nuestros tokens. En su lugar, `fill` referencia directamente
 * la CSS var del tema activo — así el toast sigue a `html[data-theme]`
 * (claro/oscuro) igual que el resto de la UI, sin lógica extra. El resto
 * del restyle (borde, tipografía, color de texto/estado, sombra) vive en
 * globals.css, sección "Toast (sileo)", porque toca el DOM interno de la
 * librería y no son props expuestas por `SileoOptions`.
 */
export function Toaster() {
	return (
		<SileoToaster
			position="top-right"
			options={{ fill: "var(--color-surface-2)", roundness: 12 }}
		/>
	);
}
