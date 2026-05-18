"use client";

import { MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { VenueOption } from "../types";

type CanchasTabProps = {
	leagueId: string;
	venues: VenueOption[];
};

function VenueCard({ venue }: { venue: VenueOption }) {
	return (
		<div className="surface-card-2" style={{ padding: 14 }}>
			<div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: 7,
						flexShrink: 0,
						background: "rgba(0,230,118,0.12)",
						display: "grid",
						placeItems: "center",
					}}
				>
					<MapPin size={15} color="var(--color-brand)" />
				</div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
							{venue.name}
						</span>
						<span className="chip brand" style={{ padding: "1px 7px", fontSize: 10 }}>
							Activa
						</span>
					</div>
					{venue.slots.length > 0 && (
						<div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
							{venue.slots.map((slot, i) => (
								<div
									key={i}
									style={{
										fontSize: 11,
										color: "var(--color-ink-2)",
										fontFamily: "var(--font-mono)",
										padding: "3px 8px",
										background: "var(--color-pitch)",
										borderRadius: 5,
										display: "inline-block",
										width: "fit-content",
									}}
								>
									{slot}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export function CanchasTab({ leagueId, venues }: CanchasTabProps) {
	const canchasHref = `/admin/leagues/${leagueId}/sorteo/canchas`;

	return (
		<div style={{ padding: "18px 20px 24px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: 12,
					marginBottom: 14,
				}}
			>
				<div>
					<h3
						style={{
							margin: 0,
							fontFamily: "var(--font-display)",
							fontWeight: 800,
							fontSize: 16,
							letterSpacing: "-0.01em",
						}}
					>
						Canchas asignadas a esta liga
					</h3>
					<div
						style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 4, lineHeight: 1.45 }}
					>
						El sorteo solo usará estas canchas y dentro de los horarios definidos.{" "}
						<Link href={canchasHref} style={{ color: "var(--color-brand)" }}>
							Configurar canchas →
						</Link>
					</div>
				</div>
				<Link
					href={canchasHref}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						fontSize: 12,
						color: "var(--color-ink-2)",
						textDecoration: "none",
					}}
					className="btn-ghost"
				>
					<ExternalLink size={11} /> Gestionar canchas
				</Link>
			</div>

			{venues.length === 0 ? (
				<div
					style={{
						textAlign: "center",
						padding: "32px 0",
						color: "var(--color-ink-3)",
						fontSize: 13,
					}}
				>
					No hay canchas asignadas a esta liga.
				</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
					{venues.map((v) => (
						<VenueCard key={v.id} venue={v} />
					))}
				</div>
			)}
		</div>
	);
}
