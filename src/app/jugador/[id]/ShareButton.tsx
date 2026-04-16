"use client";

import { useState } from "react";

export default function ShareButton({
  url,
  playerName,
}: {
  url: string;
  playerName: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // En móvil usa la API nativa de compartir
    if (navigator.share) {
      await navigator.share({
        title: `${playerName} — TalachaStats`,
        text: `Mira las estadísticas de ${playerName} en TalachaStats`,
        url,
      });
      return;
    }
    // En desktop copia al portapapeles
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      onClick={handleShare}
      className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
    >
      {copied ? (
        <>✅ ¡Enlace copiado!</>
      ) : (
        <>⬆️ Compartir perfil</>
      )}
    </button>
  );
}
