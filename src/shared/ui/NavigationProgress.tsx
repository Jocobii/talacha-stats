"use client";

/**
 * NavigationProgress
 *
 * Barra de progreso delgada en el tope de la pantalla que:
 *  - Arranca al hacer clic en cualquier <a> interno (feedback inmediato)
 *  - Se completa cuando usePathname detecta que la navegación terminó
 *  - Funciona para admin y public sin configuración extra
 *
 * Debe ir en el root layout envuelto en <Suspense> (ya incluido aquí).
 */

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    setVisible(true);
    setWidth(12);

    intervalRef.current = setInterval(() => {
      setWidth((w) => (w < 85 ? w + (85 - w) * 0.08 : w));
    }, 150);
  }

  function complete() {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setWidth(100);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 380);
  }

  // La navegación terminó → completar la barra
  useEffect(() => {
    complete();
    return () => {
      clearTimeout(timerRef.current!);
      clearInterval(intervalRef.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // Interceptar clics en links internos → arrancar la barra
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest("a");
      if (!link) return;

      const href = link.getAttribute("href") ?? "";
      // Ignorar: externos, anclas, mailto, tel, _blank
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        link.target === "_blank"
      ) return;

      start();
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-hidden="true"
      style={{ width: `${width}%` }}
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-brand shadow-[0_0_8px_0px] shadow-brand transition-[width] duration-300 ease-out pointer-events-none"
    />
  );
}

// Suspense necesario por useSearchParams
export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
