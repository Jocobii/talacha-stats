"use client";

/**
 * ShareStandingsButton.tsx
 * Botones de compartir para la pantalla de Posiciones del admin.
 * Dos acciones independientes: Tabla general y Goleo general.
 */

import { Share2, Download, Trophy, BarChart2 } from "lucide-react";

type Props = {
	leagueId: string;
};

type AssetConfig = {
	label: string;
	icon: React.ReactNode;
	imageUrl: string;
	filename: string;
	shareTitle: string;
	shareText: string;
};

function buildAssets(leagueId: string): AssetConfig[] {
	return [
		{
			label: "Tabla",
			icon: <BarChart2 size={14} strokeWidth={2} />,
			imageUrl: `/api/content/standings-image?leagueId=${leagueId}`,
			filename: "tabla-general.png",
			shareTitle: "Tabla de posiciones · TalachaStats",
			shareText: "Mira cómo va la tabla 👇",
		},
		{
			label: "Goleadores",
			icon: <Trophy size={14} strokeWidth={2} />,
			imageUrl: `/api/content/scorers-image?leagueId=${leagueId}`,
			filename: "goleadores.png",
			shareTitle: "Goleadores del torneo · TalachaStats",
			shareText: "Mira el goleo del torneo ⚽",
		},
	];
}

function AssetButton({ asset }: { asset: AssetConfig }) {
	async function handleShare() {
		const fullUrl = `${window.location.origin}${asset.imageUrl}`;
		if (typeof navigator !== "undefined" && navigator.share) {
			try {
				await navigator.share({ title: asset.shareTitle, text: asset.shareText, url: fullUrl });
			} catch {
				// usuario canceló
			}
			return;
		}
		// Fallback desktop: descarga directa
		const a = document.createElement("a");
		a.href = asset.imageUrl;
		a.download = asset.filename;
		a.click();
	}

	return (
		<div className="flex items-center gap-1">
			{/* Compartir (Web Share / descarga) */}
			<button
				onClick={handleShare}
				className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-l-md bg-brand text-pitch hover:bg-brand-dim transition-colors"
			>
				<Share2 size={13} strokeWidth={2} />
				{asset.label}
			</button>
			{/* Descarga directa */}
			<a
				href={asset.imageUrl}
				download={asset.filename}
				className="h-8 w-7 flex items-center justify-center rounded-r-md bg-brand hover:bg-brand-dim border-l border-pitch/20 transition-colors text-pitch"
				title={`Descargar ${asset.label}`}
			>
				<Download size={12} strokeWidth={2.5} />
			</a>
		</div>
	);
}

export function ShareStandingsButton({ leagueId }: Props) {
	const assets = buildAssets(leagueId);
	return (
		<div className="flex items-center gap-2">
			{assets.map((asset) => (
				<AssetButton key={asset.label} asset={asset} />
			))}
		</div>
	);
}
