/**
 * OrgHomeHero.tsx — hero del home del subdominio de una org.
 * Presentacional (server-safe): iniciales/logo, nombre, ciudad y conteos.
 * El acento sale del tema de la org (tokens brand, ver OrgThemeScope).
 */

import { MapPin, Trophy, Users } from "lucide-react";

type Props = {
	name: string;
	city: string;
	logoUrl: string | null;
	leaguesLabel: string;
	teamsLabel: string;
};

export default function OrgHomeHero({ name, city, logoUrl, leaguesLabel, teamsLabel }: Props) {
	const initial = name.charAt(0).toUpperCase();

	return (
		<div className="relative overflow-hidden bg-surface border border-line rounded-2xl px-6 py-6 sm:px-7">
			{/* Watermark de la inicial */}
			<span
				aria-hidden
				className="pointer-events-none absolute -right-2 -top-8 font-display font-black text-brand/[0.06] leading-none select-none"
				style={{ fontSize: 180 }}
			>
				{initial}
			</span>

			<div className="relative flex items-center gap-4 sm:gap-5">
				{logoUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={logoUrl}
						alt=""
						width={64}
						height={64}
						className="w-16 h-16 rounded-2xl object-cover border border-brand/40 shrink-0"
					/>
				) : (
					<span className="w-16 h-16 rounded-2xl shrink-0 grid place-items-center bg-brand/15 border border-brand/40 font-display font-black text-brand-ink text-3xl">
						{initial}
					</span>
				)}

				<div className="min-w-0">
					<h1 className="font-display font-black text-2xl sm:text-3xl text-ink tracking-tight truncate">
						{name}
					</h1>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[13px] text-ink-2">
						<span className="flex items-center gap-1.5">
							<MapPin size={13} strokeWidth={1.75} />
							{city}
						</span>
						<span className="flex items-center gap-1.5">
							<Trophy size={13} strokeWidth={1.75} />
							{leaguesLabel}
						</span>
						<span className="flex items-center gap-1.5">
							<Users size={13} strokeWidth={1.75} />
							{teamsLabel}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
