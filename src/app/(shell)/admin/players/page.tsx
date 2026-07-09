/**
 * /admin/players — Lista de jugadores de la organización
 *
 * Server Component. Los datos (rows, totales) se calculan aquí y se pasan
 * como props serializables al Client Component PlayersTable, que define
 * las columnas con render functions (no pueden cruzar el límite server/client).
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, asc, sql, ilike } from "drizzle-orm";
import { db, globalPlayers, leagueMembers } from "@/db";
import { getSessionUser } from "@/shared/lib/auth";
import { listOrgPlayers } from "@/entities/player";
import { PlayersTable } from "./PlayersTable";
import type { OwnerPlayerRow } from "./PlayersTable";
import { DEFAULT_PAGE_SIZE, buildPagination } from "@/shared/ui/admin-table.helpers";

// ── Página principal ──────────────────────────────────────────────────────────

export default async function PlayersPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const [user, params] = await Promise.all([getSessionUser(), searchParams]);
	if (!user) redirect("/login");

	const page = Math.max(1, Number(params.page ?? 1));
	const search = params.q?.trim() ?? "";
	const isOwner = user.role === "owner";

	// ── Owner: todos los global_players ──────────────────────────────────────
	if (isOwner) {
		const whereFilter = search ? ilike(globalPlayers.fullName, `%${search}%`) : undefined;

		const [ownerRows, ownerCount] = await Promise.all([
			db
				.select({
					globalPlayerId: globalPlayers.id,
					fullName: globalPlayers.fullName,
					birthDate: globalPlayers.birthDate,
					leagueCount: sql<number>`COUNT(DISTINCT ${leagueMembers.id})::int`.as("league_count"),
				})
				.from(globalPlayers)
				.leftJoin(leagueMembers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
				.where(whereFilter)
				.groupBy(globalPlayers.id)
				.orderBy(asc(globalPlayers.fullName))
				.limit(DEFAULT_PAGE_SIZE)
				.offset((page - 1) * DEFAULT_PAGE_SIZE),

			db
				.select({ total: sql<number>`COUNT(*)::int` })
				.from(globalPlayers)
				.where(whereFilter),
		]);

		const total = ownerCount[0]?.total ?? 0;

		const rows: OwnerPlayerRow[] = ownerRows.map((r) => ({
			globalPlayerId: r.globalPlayerId,
			fullName: r.fullName,
			birthDate: r.birthDate,
			leagueCount: r.leagueCount,
		}));

		return (
			<PlayersLayout title="Todos los jugadores" total={total} page={page} search={search} isOwner>
				<PlayersTable
					variant="owner"
					rows={rows}
					pagination={buildPagination(page, total, "/admin/players", {
						extraParams: search ? { q: search } : {},
					})}
					emptyMessage={
						search
							? `No se encontraron jugadores con "${search}".`
							: "No hay jugadores registrados en el sistema."
					}
					countLabel={`${total} jugador${total !== 1 ? "es" : ""}`}
				/>
			</PlayersLayout>
		);
	}

	// ── Organizer: jugadores de su org ────────────────────────────────────────
	if (!user.organizationId) {
		return (
			<PlayersLayout title="Jugadores" total={0} page={1} search="" isOwner={false}>
				<div className="bg-surface rounded-xl shadow p-10 text-center text-ink-3 text-sm">
					Tu cuenta no está asociada a ninguna organización. Contacta a un administrador.
				</div>
			</PlayersLayout>
		);
	}

	const { rows, total } = await listOrgPlayers(user.organizationId, {
		page,
		pageSize: DEFAULT_PAGE_SIZE,
		search: search || undefined,
	});

	return (
		<PlayersLayout title="Jugadores" total={total} page={page} search={search} isOwner={false}>
			<PlayersTable
				variant="org"
				rows={rows}
				pagination={buildPagination(page, total, "/admin/players", {
					extraParams: search ? { q: search } : {},
				})}
				emptyMessage={
					search
						? `No se encontraron jugadores con "${search}".`
						: "Aún no hay jugadores inscritos en tu organización."
				}
				countLabel={`${total} jugador${total !== 1 ? "es" : ""} en tu organización`}
			/>
		</PlayersLayout>
	);
}

// ── Layout compartido ─────────────────────────────────────────────────────────

function PlayersLayout({
	title,
	total,
	page,
	search,
	isOwner,
	children,
}: {
	title: string;
	total: number;
	page: number;
	search: string;
	isOwner: boolean;
	children: ReactNode;
}) {
	return (
		<div className="space-y-5">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-ink">{title}</h1>
					{total > 0 && (
						<p className="text-sm text-ink-3 mt-0.5">
							{total} jugador{total !== 1 ? "es" : ""}
							{page > 1 ? ` · pág. ${page}` : ""}
						</p>
					)}
				</div>
				{!isOwner && (
					<Link
						href="/admin/registro"
						className="inline-flex items-center gap-1.5 bg-brand text-pitch text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand/90 transition"
					>
						+ Nuevo jugador
					</Link>
				)}
			</div>

			{/* Buscador */}
			<SearchBar defaultValue={search} />

			{/* Tabla */}
			{children}
		</div>
	);
}

// ── Buscador (form nativo, compatible con Server Components) ─────────────────

function SearchBar({ defaultValue }: { defaultValue: string }) {
	return (
		<form method="get" action="/admin/players">
			<div className="flex gap-2">
				<input
					type="search"
					name="q"
					defaultValue={defaultValue}
					placeholder="Buscar jugador por nombre…"
					className="flex-1 border border-line rounded-xl px-3.5 py-2 text-sm bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand"
				/>
				<button
					type="submit"
					className="bg-surface border border-line text-ink-2 text-sm px-4 py-2 rounded-xl hover:bg-surface-2 transition"
				>
					Buscar
				</button>
				{defaultValue && (
					<Link
						href="/admin/players"
						className="bg-surface border border-line text-ink-3 text-sm px-4 py-2 rounded-xl hover:bg-surface-2 transition"
					>
						✕
					</Link>
				)}
			</div>
		</form>
	);
}
