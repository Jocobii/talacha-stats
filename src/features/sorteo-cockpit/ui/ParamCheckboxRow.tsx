"use client";

type ParamCheckboxRowProps = {
	icon: React.ReactNode;
	label: string;
	help: string;
	checked: boolean;
	onChange: (v: boolean) => void;
};

export function ParamCheckboxRow({ icon, label, help, checked, onChange }: ParamCheckboxRowProps) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "flex-start",
				gap: 12,
				padding: 12,
				borderRadius: 8,
				background: "var(--color-surface-2)",
				border: "1px solid var(--color-line)",
			}}
		>
			<div
				style={{
					width: 28,
					height: 28,
					borderRadius: 6,
					flexShrink: 0,
					background: "var(--color-pitch)",
					color: "var(--color-ink-2)",
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
			<div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
				<input
					type="checkbox"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					style={{ width: 18, height: 18, accentColor: "var(--color-brand)", cursor: "pointer" }}
				/>
			</div>
		</div>
	);
}
