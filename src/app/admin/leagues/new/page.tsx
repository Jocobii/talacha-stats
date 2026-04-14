"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DAYS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

export default function NewLeaguePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", dayOfWeek: "lunes", season: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.season.trim()) {
      setError("Nombre y temporada son obligatorios.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      router.push(`/admin/leagues/${data.data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/admin/leagues" className="text-sm text-gray-500 hover:underline">
          ← Ligas
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-1">Nueva liga</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la liga <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Liga Lunes Tijuana"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Día de la semana <span className="text-red-500">*</span>
          </label>
          <select
            value={form.dayOfWeek}
            onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temporada <span className="text-red-500">*</span>
          </label>
          <input
            value={form.season}
            onChange={(e) => setForm({ ...form, season: e.target.value })}
            placeholder="Apertura 2025"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1">Ej: Apertura 2025, Clausura 2026, 2026-1</p>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear liga"}
          </button>
          <Link
            href="/admin/leagues"
            className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-200"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
