/**
 * OrgLeagueRow.tsx — fila de una liga en el directorio del home (Zona 3).
 * Extraída de OrgLeaguesGrid para mantener ambos archivos bajo 150 líneas
 * (§3.5 AGENTS.md). Enlaza a la página pública de la liga (`/{slug}`).
 */

import { Inline, Stack } from "@/shared/ui/layout";
import { Typography } from "@/shared/ui";
import { Link } from "@/shared/i18n/navigation";

export function OrgLeagueRow({
	slug,
	name,
	statusLabel,
	viewLabel,
}: {
	slug: string;
	name: string;
	statusLabel: string;
	viewLabel: string;
}) {
	return (
		<Link
			href={`/${slug}`}
			className="group flex items-center justify-between gap-3 bg-surface border border-line rounded-xl px-4 py-3.5 transition-colors hover:border-line-2"
		>
			<Stack gap="none" className="min-w-0">
				<Typography variant="bodySm" weight="bold" truncate>
					{name}
				</Typography>
				<Typography variant="caption" tone="ink-3">
					{statusLabel}
				</Typography>
			</Stack>
			<Inline
				gap="xs"
				className="shrink-0 text-xs font-semibold text-brand-ink group-hover:text-ink transition-colors"
			>
				{viewLabel}
			</Inline>
		</Link>
	);
}
