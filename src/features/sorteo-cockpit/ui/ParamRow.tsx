"use client";

type ParamRowProps = {
	icon: React.ReactNode;
	label: string;
	help: string;
	value: number;
	unit: string;
	highlight?: boolean;
	onChange: (v: number) => void;
};

export function ParamRow({
	icon,
	label,
	help,
	value,
	unit,
	highlight = false,
	onChange,
}: ParamRowProps) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "flex-start",
				gap: 12,
				padding: 12,
				borderRadius: 8,
				background: highlight ? "rgba(0,230,118,0.04)" : "var(--color-surface-2)",
				border: `1px solid ${highlight ? "rgba(0,230,118,0.22)" : "var(--color-line)"}`,
			}}
		>
			<div
				style={{
					width: 28,
					height: 28,
					borderRadius: 6,
					flexShrink: 0,
					background: highlight ? "rgba(0,230,118,0.14)" : "var(--color-pitch)",
					color: highlight ? "var(--color-brand)" : "var(--color-ink-2)",
					display: "grid",
					placeItems: "center",
				}}
			>
				{icon}
			</div>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div style={{ fontSize: 13, color: "var(--color-ink)", fontWeight: 500 }}>{label}</div>
				<div style={{ fontSize: 11, color: "var(--color-ink-3)", marginTop: 3, lineHeight: 1.4 }}>
					{help}
				</div>
			</div>
			<div style={{ display: "flex", alignItems: "baseline", gap: 5, flexShrink: 0 }}>
				<input
					type="number"
					min={1}
					value={value}
					onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
					style={{
						background: "var(--color-pitch)",
						border: "1px solid var(--color-line)",
						color: "var(--color-ink)",
						width: 56,
						textAlign: "right",
						fontFamily: "var(--font-mono)",
						fontSize: 13,
						fontWeight: 600,
						borderRadius: 6,
						padding: "5px 8px",
					}}
				/>
				<span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>{unit}</span>
			</div>
		</div>
	);
}
