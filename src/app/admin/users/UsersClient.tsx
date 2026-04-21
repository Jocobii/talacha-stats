"use client";

import { useState }     from "react";
import type { UserPublic } from "@/entities/user";

const ROLE_LABELS: Record<string, string> = {
  owner:     "Owner",
  organizer: "Organizador",
};

export default function UsersClient({
  users: initial,
  currentUserId,
}: {
  users: UserPublic[];
  currentUserId: string;
}) {
  const [users, setUsers]   = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState({ email: "", password: "", name: "", role: "organizer" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res  = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      setUsers([...users, data.data]);
      setShowForm(false);
      setForm({ email: "", password: "", name: "", role: "organizer" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user: UserPublic) {
    if (user.id === currentUserId) return;
    const res  = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    const data = await res.json();
    if (data.ok) {
      setUsers(users.map(u => u.id === user.id ? data.data : u));
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Nombre</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Rol</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className={!u.active ? "opacity-50" : ""}>
                <td className="px-5 py-3 font-medium text-gray-800">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs text-green-600 font-semibold">(tú)</span>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-500">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    u.role === "owner"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    u.active ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-600"
                  }`}>
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => handleToggleActive(u)}
                      className="text-xs text-gray-400 hover:text-gray-700 transition"
                    >
                      {u.active ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Botón / Formulario de nuevo usuario */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          + Nuevo organizador
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow p-6 space-y-4 max-w-md"
        >
          <h2 className="font-semibold text-gray-800">Nuevo organizador</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Carlos Ramírez"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="carlos@ejemplo.com"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña inicial</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="organizer">Organizador</option>
              <option value="owner">Owner (superadmin)</option>
            </select>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Creando…" : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
