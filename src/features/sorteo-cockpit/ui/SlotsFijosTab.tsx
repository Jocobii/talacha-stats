"use client";

import { Lock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { TeamBadge } from "@/shared/ui";
import type { TeamWithAttendance } from "../types";

type SlotsFijosTabProps = {
	leagueId: string;
	teams: TeamWithAttendance[];
};

export function SlotsFijosTab({ leagueId, teams }: SlotsFijosTabProps) {
	const teamsWithSlots = teams.filter((t) => t.purchasedSlot !== null);

	return (
		<div style={{ padding: "18px 20px" }}>
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
						Slots fijos comprados
					</h3>
					<div
						style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 4, lineHeight: 1.45 }}
					>
						El sorteo respetará estos slots automáticamente.
					</div>
				</div>
				<Link
					href={`/admin/leagues/${leagueId}/sorteo/configuracion`}
					className="btn-ghost"
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						fontSize: 12,
						textDecoration: "none",
						padding: "6px 10px",
					}}
				>
					<ExternalLink size={11} /> Administrar
				</Link>
			</div>

			{teamsWithSlots.length === 0 ? (
				<div
					style={{
						color: "var(--color-ink-3)",
						fontSize: 13,
						textAlign: "center",
						padding: "24px 0",
					}}
				>
					No hay slots fijos registrados.
				</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
					{teamsWithSlots.map((t) => (
						<div
							key={t.id}
							className="surface-card-2"
							style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}
						>
							<div
								style={{
									width: 30,
									height: 30,
									borderRadius: 6,
									background: "rgba(96,165,250,0.12)",
									display: "grid",
									placeItems: "center",
								}}
							>
								<Lock size={13} color="var(--color-blue)" />
							</div>
							<TeamBadge teamId={t.id} name={t.name} color={t.color} short={t.short} size="sm" />
							<div style={{ flex: 1 }}>
								<div style={{ fontSize: 13, color: "var(--color-ink)" }}>{t.name}</div>
								{t.purchasedSlot && (
									<div style={{ fontSize: 11, color: "var(--color-ink-3)", marginTop: 2 }}>
										{t.purchasedSlot.venueName} · {t.purchasedSlot.startTime}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			<div style={{ marginTop: 16 }}>
				<Link
					href={`/admin/leagues/${leagueId}/sorteo/configuracion`}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						fontSize: 12,
						color: "var(--color-brand)",
						textDecoration: "none",
					}}
				>
					Administrar slots fijos → <ExternalLink size={11} />
				</Link>
			</div>
		</div>
	);
}
