"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export default function ShareLeagueButton({ leagueName }: { leagueName: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: leagueName, url });
      } catch {
        // user cancelled
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-brand transition-colors"
    >
      {copied ? (
        <>
          <Check size={16} strokeWidth={2} className="text-brand" />
          <span className="text-brand">¡Copiado!</span>
        </>
      ) : (
        <>
          <Share2 size={16} strokeWidth={2} />
          Compartir
        </>
      )}
    </button>
  );
}
