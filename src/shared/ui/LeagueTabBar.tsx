"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, Shuffle, CalendarDays, Settings, MapPin, ScrollText } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type Tab = {
	label: string;
	href: string;

	icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
	inactive?: boolean;
};

type Props = {
	leagueId: string;
	schedulingEnabled: boolean;
};

export function LeagueTabBar({ leagueId, schedulingEnabled }: Props) {
	const pathname = usePathname();

	const tabs: Tab[] = [
		{
			label: "Posiciones",
			href: `/admin/leagues/${leagueId}/posiciones`,
			icon: LayoutList,
		},
		{
			label: "Sorteo",
			href: `/admin/leagues/${leagueId}/sorteo`,
			icon: Shuffle,
			inactive: !schedulingEnabled,
		},
		...(schedulingEnabled
			? [
					{
						label: "Canchas",
						href: `/admin/leagues/${leagueId}/canchas`,
						icon: MapPin,
					} satisfies Tab,
				]
			: []),
		{
			label: "Calendario",
			href: `/admin/leagues/${leagueId}/calendario`,
			icon: CalendarDays,
		},
		{
			label: "Reglamento",
			href: `/admin/leagues/${leagueId}/reglamento`,
			icon: ScrollText,
		},
		{
			label: "Configuración",
			href: `/admin/leagues/${leagueId}/configuracion`,
			icon: Settings,
		},
	];

	return (
		<nav className="flex gap-0.5 border-b border-line mt-5 -mx-px">
			{tabs.map((tab) => {
				const Icon = tab.icon;
				const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

				return (
					<Link
						key={tab.href}
						href={tab.href}
						className={cn(
							"flex items-center gap-1.5 px-4 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px transition-colors",
							isActive
								? "border-brand text-brand-ink"
								: "border-transparent text-ink-2 hover:text-ink hover:border-line",
						)}
					>
						<Icon size={14} strokeWidth={isActive ? 2 : 1.75} className="shrink-0" />
						{tab.label}
						{tab.inactive && (
							<span className="ml-1 text-[10px] font-semibold text-ink-3 bg-surface-2 border border-line px-1.5 py-px rounded-full leading-none">
								Inactivo
							</span>
						)}
					</Link>
				);
			})}
		</nav>
	);
}
