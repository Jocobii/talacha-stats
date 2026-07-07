import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlayerProfile, getPlayerEgoStats } from "@/entities/player";
import PlayerEditorialProfile from "./PlayerEditorialProfile";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const profile = await getPlayerProfile(id);
	if (!profile) return { title: "Jugador no encontrado" };

	const name = profile.alias ? `${profile.fullName} "${profile.alias}"` : profile.fullName;

	const g = profile.global;
	const desc =
		g.totalGoals > 0
			? `${g.totalGoals} goles en ${g.leaguesCount} liga${g.leaguesCount !== 1 ? "s" : ""}${g.totalMatches > 0 ? ` · ${g.goalsPerMatch.toFixed(2)} goles/partido` : ""}`
			: "Jugador amateur de fútbol 7";

	return {
		title: `${name} — TalachaStats`,
		description: desc,
		openGraph: { title: name, description: desc, type: "profile" },
	};
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [profile, egoStats] = await Promise.all([getPlayerProfile(id), getPlayerEgoStats(id)]);
	if (!profile) return notFound();

	const { global: g } = profile;
	const hasStats = g.totalGoals > 0 || g.totalMatches > 0;
	const initial = (profile.alias ?? profile.fullName).charAt(0).toUpperCase();

	return (
		<div className="relative min-h-screen bg-pitch text-ink flex flex-col overflow-hidden">
			{/* ── Capa decorativa de fondo — cubre toda la pantalla ── */}
			<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
				{/* Glow radial verde — esquina superior derecha */}
				<div
					style={{
						position: "absolute",
						top: "-15%",
						right: "-10%",
						width: "65%",
						height: "75%",
						background:
							"radial-gradient(ellipse at 70% 25%, rgba(0,230,118,0.20) 0%, rgba(0,230,118,0.08) 45%, transparent 70%)",
					}}
				/>
				{/* Glow secundario tenue — esquina inferior izquierda */}
				<div
					style={{
						position: "absolute",
						bottom: "-10%",
						left: "-10%",
						width: "50%",
						height: "50%",
						background:
							"radial-gradient(ellipse at 30% 70%, rgba(0,230,118,0.09) 0%, transparent 60%)",
					}}
				/>
				{/* Líneas de cancha SVG */}
				<svg
					className="absolute inset-0 w-full h-full"
					xmlns="http://www.w3.org/2000/svg"
					preserveAspectRatio="xMidYMid slice"
				>
					<circle
						cx="88%"
						cy="14%"
						r="22%"
						fill="none"
						stroke="#00E676"
						strokeWidth="1"
						opacity="0.1"
					/>
					<circle cx="88%" cy="14%" r="0.6%" fill="#00E676" opacity="0.22" />
					<ellipse
						cx="8%"
						cy="102%"
						rx="28%"
						ry="20%"
						fill="none"
						stroke="#00E676"
						strokeWidth="1"
						opacity="0.07"
					/>
				</svg>
			</div>
			<div className="max-w-lg mx-auto w-full px-4 pt-10 pb-20 flex flex-col gap-5">
				{/* ── Header: Avatar small left + name right ── */}
				<div className="flex items-start gap-4">
					<div className="w-14 h-14 rounded-xl bg-brand flex items-center justify-center text-2xl font-display font-black text-pitch shrink-0">
						{initial}
					</div>
					<div className="flex-1 pt-1">
						<h1 className="font-display font-black text-2xl sm:text-3xl text-ink leading-tight uppercase">
							{profile.fullName}
						</h1>
						{profile.alias && (
							<p className="text-brand-ink text-sm font-semibold mt-1">
								&quot;{profile.alias}&quot;
							</p>
						)}
					</div>
				</div>

				<PlayerEditorialProfile
					view={profile}
					ego={egoStats}
					shareUrl={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/player/${id}`}
				/>
				{/* ── Tabs: Temporada / Carrera ── */}
				{/* <PlayerTabs leagues={profile.leagues} teamGoalShares={egoStats.teamGoalShares} global={g} /> */}

				{!hasStats && (
					<div className="bg-surface border border-line rounded-2xl p-8 text-center text-ink-2 text-sm">
						Este jugador aún no tiene estadísticas registradas.
					</div>
				)}
			</div>
		</div>
	);
}
