"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Componente invisible que registra una visita a la página actual.
 * Se agrega a los layouts o páginas públicas.
 * No renderiza nada — solo dispara el tracking al montar.
 */
export default function TrackVisit() {
  const pathname = usePathname();

  useEffect(() => {
    // Normalizar rutas de perfil de jugador → "/jugador/[id]"
    const page = pathname.startsWith("/jugador/")
      ? "/jugador/[id]"
      : pathname;

    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page }),
    }).catch(() => {
      // Silenciar — nunca romper la UX por un error de analytics
    });
  }, [pathname]);

  return null;
}
