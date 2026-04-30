import { MapPin, Users, CalendarDays } from "lucide-react";
import { titleCase } from "@/shared/lib/normalize";

type Props = {
	name: string;
	city: string;
	logoUrl: string | null;
	totalLeagues: number;
	totalTeams: number;
};

export default function OrgHeroHeader({ name, city, logoUrl, totalLeagues, totalTeams }: Props) {
	const initial = name.charAt(0).toUpperCase();

	return (
		<div className="relative flex items-start gap-4">
			{/* Watermark — inicial gigante como identidad visual */}
			<span
				aria-hidden="true"
				className="pointer-events-none select-none absolute -right-2 -top-4 font-display font-black text-[8rem] leading-none text-brand/5 uppercase"
			>
				{initial}
			</span>

			{/* Logo */}
			{logoUrl ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={logoUrl}
					alt={name}
					className="relative z-10 w-16 h-16 rounded-2xl object-cover border border-line shrink-0"
				/>
			) : (
				<div className="relative z-10 w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
					<span className="font-display font-black text-3xl text-brand">{initial}</span>
				</div>
			)}

			{/* Nombre + meta */}
			<div className="relative z-10 flex-1 min-w-0">
				<h1 className="font-display font-black text-3xl uppercase tracking-tight leading-tight">
					{titleCase(name)}
				</h1>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
					<MetaChip icon={<MapPin size={12} strokeWidth={2} />} label={city} />
					<MetaChip
						icon={<CalendarDays size={12} strokeWidth={2} />}
						label={`${totalLeagues} liga${totalLeagues !== 1 ? "s" : ""}`}
					/>
					<MetaChip icon={<Users size={12} strokeWidth={2} />} label={`${totalTeams} equipos`} />
				</div>
			</div>
		</div>
	);
}

function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
	return (
		<span className="flex items-center gap-1 text-xs text-ink-3">
			{icon}
			{label}
		</span>
	);
}
