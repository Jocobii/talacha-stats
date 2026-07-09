import type { LucideIcon } from "lucide-react";

/** Cabecera de sección para los tabs de coordinador. */
export function CoordHeader({
	icon: Icon,
	title,
	subtitle,
}: {
	icon: LucideIcon;
	title: string;
	subtitle: string;
}) {
	return (
		<div className="bg-pitch px-5 pt-8 pb-6 max-w-4xl mx-auto w-full">
			<div className="flex items-center gap-2 mb-1">
				<Icon size={24} className="text-brand-ink" strokeWidth={2} />
				<h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
					{title}
				</h1>
			</div>
			<p className="text-ink-2 text-sm mt-0.5">{subtitle}</p>
		</div>
	);
}
