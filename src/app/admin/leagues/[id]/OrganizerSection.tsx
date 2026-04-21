"use client";

import { useState } from "react";

type Organizer = { id: string; name: string; email: string };
type Props = {
  leagueId: string;
  current: Organizer | null;
  organizers: Organizer[];
};

export default function OrganizerSection({ leagueId, current, organizers }: Props) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(current?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${leagueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: selected || null }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      setEditing(false);
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Organizador</h2>

      {editing ? (
        <div className="space-y-3">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">— Sin asignar —</option>
            {organizers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.email})
              </option>
            ))}
          </select>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => { setEditing(false); setSelected(current?.id ?? ""); setError(""); }}
              className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            {current ? (
              <>
                <p className="text-sm font-medium text-gray-800">{current.name}</p>
                <p className="text-xs text-gray-400">{current.email}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Sin asignar</p>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-green-600 hover:underline"
          >
            Cambiar
          </button>
        </div>
      )}
    </div>
  );
}
