import Link from "next/link";
import { Suspense } from "react";
import Pagination from "@/shared/ui/Pagination";
import FilterBar from "@/shared/ui/FilterBar";
import type { PaginationMeta } from "@/shared/lib/pagination";
import { getActiveCity } from "@/shared/lib/active-city";

type Player = { id: string; fullName: string; alias: string | null; phone: string | null };

async function getPlayers(searchParams: Record<string, string>, city: string) {
  const base   = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const params = new URLSearchParams();
  params.set("city", city);
  if (searchParams.q)     params.set("q",     searchParams.q);
  if (searchParams.page)  params.set("page",  searchParams.page);
  if (searchParams.limit) params.set("limit", searchParams.limit);

  const res = await fetch(`${base}/api/players?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return { data: [] as Player[], meta: null };

  const json = await res.json();
  return {
    data: (json.data ?? []) as Player[],
    meta: (json.meta ?? null) as PaginationMeta | null,
  };
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [params, city] = await Promise.all([searchParams, getActiveCity()]);
  const { data: players, meta } = await getPlayers(params, city);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Jugadores</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {city}{meta ? ` · ${meta.total} jugadores` : ""}
            {meta && meta.totalPages > 1 && ` · pág. ${meta.page}/${meta.totalPages}`}
          </p>
        </div>
        <Link
          href="/admin/players/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
        >
          + Nuevo jugador
        </Link>
      </div>

      <div className="mb-5">
        <Suspense>
          <FilterBar
            fields={[
              {
                type: "search",
                name: "q",
                placeholder: "Buscar por nombre o apodo…",
                label: "Buscar jugadores",
              },
            ]}
          />
        </Suspense>
      </div>

      {players.length === 0 ? (
        <p className="text-gray-500 py-8 text-center text-sm">No se encontraron jugadores en {city}.</p>
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
              {players.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{p.alias ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{p.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/players/${p.id}`} className="text-green-600 hover:underline">
                      Ver stats
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-6">
          <Suspense>
            <Pagination meta={meta} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
