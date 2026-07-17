"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Palette, ClipboardList, Layers, MapPin, Users, IdCard } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type Tab = {
	label: string;
	href: string;
	icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

type Props = {
	/** Slug de la organización activa — solo se usa (y se propaga en la URL) si el usuario es owner. */
	orgSlug?: string;
};

const TABS: Tab[] = [
	{ label: "General", href: "/admin/organizacion", icon: Settings },
	{ label: "Tema", href: "/admin/organizacion/tema", icon: Palette },
	{ label: "Reglamento", href: "/admin/organizacion/reglamento", icon: ClipboardList },
	{ label: "Credenciales", href: "/admin/organizacion/credenciales", icon: IdCard },
	{ label: "Sorteo", href: "/admin/organizacion/sorteo", icon: Layers },
	{ label: "Canchas", href: "/admin/organizacion/canchas", icon: MapPin },
	{ label: "Miembros", href: "/admin/organizacion/miembros", icon: Users },
];

export function OrgTabBar({ orgSlug }: Props) {
	const pathname = usePathname();
	const qs = orgSlug ? `?org=${orgSlug}` : "";

	return (
		<nav className="flex gap-0.5 border-b border-line mt-5 -mx-px">
			{TABS.map((tab) => {
				const Icon = tab.icon;
				const isActive = pathname === tab.href;

				return (
					<Link
						key={tab.href}
						href={`${tab.href}${qs}`}
						className={cn(
							"flex items-center gap-1.5 px-4 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px transition-colors",
							isActive
								? "border-brand text-brand-ink"
								: "border-transparent text-ink-2 hover:text-ink hover:border-line",
						)}
					>
						<Icon size={14} strokeWidth={isActive ? 2 : 1.75} className="shrink-0" />
						{tab.label}
					</Link>
				);
			})}
		</nav>
	);
}
