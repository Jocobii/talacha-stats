import Link from "next/link";

async function getPlayers(q?: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const url = q ? `/api/players?q=${encodeURIComponent(q)}` : "/api/players";
  const res = await fetch(`${base}${url}`, { cache: "no-store" });
  return res.ok ? (await res.json()).data ?? [] : [];
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const players = await getPlayers(q);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Jugadores</h1>
        <Link
          href="/admin/players/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
        >
          + Nuevo jugador
        </Link>
      </div>

      <form method="get" className="mb-6">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o apodo..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
          >
            Buscar
          </button>
        </div>
      </form>

      {players.length === 0 ? (
        <p className="text-gray-500">No se encontraron jugadores.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Apodo</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {players.map((p: { id: string; fullName: string; alias: string | null; phone: string | null }) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{p.alias ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{p.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/players/${p.id}`}
                      className="text-green-600 hover:underline"
                    >
                      Ver stats
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
