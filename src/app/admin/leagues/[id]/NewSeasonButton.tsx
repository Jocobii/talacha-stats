"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  leagueId: string;
  leagueName: string;
  dayOfWeek: string;
  adminId: string | null;
};

export default function NewSeasonButton({ leagueId, leagueName, dayOfWeek, adminId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [season, setSeason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!season.trim()) { setError("Escribe el nombre de la temporada."); return; }
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = { name: leagueName, dayOfWeek, season: season.trim() };
      if (adminId) body.adminId = adminId;

      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Error al crear la temporada."); return; }

      // Cerrar la temporada anterior automáticamente
      await fetch(`/api/leagues/${leagueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finished" }),
      });

      router.push(`/admin/leagues/${data.data.id}`);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-green-600 hover:text-green-700 hover:underline font-medium"
      >
        + Nueva temporada
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-0.5">Nueva temporada</p>
        <p className="text-xs text-gray-500">
          Se creará <strong>{leagueName}</strong> con una temporada nueva. Los datos anteriores se conservan.
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Nombre de la temporada <span className="text-red-500">*</span>
        </label>
        <input
          autoFocus
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          placeholder="Clausura 2025"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-400 mt-1">Ej: Clausura 2025, Apertura 2026, Torneo Navidad 2025</p>
      </div>

      {error && (
        <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear temporada"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setSeason(""); setError(""); }}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
