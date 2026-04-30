"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DAYS = [
  { value: "lunes",     label: "Lunes" },
  { value: "martes",    label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves",    label: "Jueves" },
  { value: "viernes",   label: "Viernes" },
  { value: "sabado",    label: "Sábado" },
  { value: "domingo",   label: "Domingo" },
];

type Organization = { id: string; name: string; city: string };

export default function NewLeagueForm({
  organizations,
  defaultOrganizationId,
}: {
  organizations: Organization[];
  defaultOrganizationId?: string; // pre-selecciona la org del organizador
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    category: "",
    dayOfWeek: "lunes",
    season: "",
    organizationId: defaultOrganizationId ?? (organizations[0]?.id ?? ""),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.season.trim()) {
      setError("Nombre y temporada son obligatorios.");
      return;
    }
    if (!form.organizationId) {
      setError("Debes seleccionar una organización.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           form.name,
          category:       form.category || undefined,
          dayOfWeek:      form.dayOfWeek,
          season:         form.season,
          organizationId: form.organizationId,
        }),
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

        {/* Organización — solo visible si el owner puede escoger entre varias */}
        {organizations.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organización <span className="text-red-500">*</span>
            </label>
            <select
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">— Seleccionar organización —</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · {o.city}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Libre, Libre Femenil, Mixto, 2015-2016…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Opcional. Solo si el torneo tiene múltiples categorías.
          </p>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la liga <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Liga Lunes, Liga Femenil, Copa…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Solo el nombre de la liga, sin repetir el nombre de la organización.
          </p>
        </div>

        {/* Día */}
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

        {/* Temporada */}
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
