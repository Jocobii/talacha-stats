/**
 * OrgShellFooter.tsx — pie del shell público de la org: "powered by" + link
 * de salida al hub de ciudad + compartir. El mockup no define footer; se
 * conserva esta funcionalidad (existía en el shell anterior) en una barra
 * discreta al final del contenido.
 */

import ShareButton from "@/shared/ui/ShareButton";

export function OrgShellFooter({
	orgName,
	viewCityLeaguesHref,
	viewCityLeaguesLabel,
	poweredByLabel,
}: {
	orgName: string;
	viewCityLeaguesHref: string;
	viewCityLeaguesLabel: string;
	poweredByLabel: string;
}) {
	return (
		<footer className="border-t border-line">
			<div className="max-w-[1120px] mx-auto px-4 md:px-0 py-5 flex flex-wrap items-center justify-between gap-3">
				<span className="flex items-center gap-1.5 text-[11px] text-ink-3 font-mono tracking-wide">
					{poweredByLabel}
					<span className="font-display font-black text-[12.5px] text-ink-2 tracking-normal">
						Talacha<span className="text-brand">Stats</span>
					</span>
				</span>
				<div className="flex items-center gap-4">
					{ }
					<a
						href={viewCityLeaguesHref}
						className="text-[11.5px] text-ink-3 hover:text-ink transition"
					>
						{viewCityLeaguesLabel}
					</a>
					<ShareButton title={orgName} variant="icon" />
				</div>
			</div>
		</footer>
	);
}
