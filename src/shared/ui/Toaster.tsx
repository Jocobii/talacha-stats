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

/** Defaults del proyecto: esquina superior-derecha y tema oscuro. */
export function Toaster() {
	return <SileoToaster position="top-right" theme="dark" />;
}
