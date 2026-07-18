"use client";

import { Inline, Center } from "@/shared/ui/layout";

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
		<Inline
			align="start"
			gap="md"
			className="rounded-lg p-3"
			style={{
				background: highlight ? "rgba(0,230,118,0.04)" : "var(--color-surface-2)",
				border: `1px solid ${highlight ? "rgba(0,230,118,0.22)" : "var(--color-line)"}`,
			}}
		>
			<Center
				className="h-7 w-7 shrink-0 rounded-md"
				style={{
					background: highlight ? "rgba(0,230,118,0.14)" : "var(--color-pitch)",
					color: highlight ? "var(--color-brand)" : "var(--color-ink-2)",
				}}
			>
				{icon}
			</Center>
			<div className="min-w-0 flex-1">
				<div style={{ fontSize: 13, color: "var(--color-ink)", fontWeight: 500 }}>{label}</div>
				<div
					className="mt-[3px]"
					style={{ fontSize: 11, color: "var(--color-ink-3)", lineHeight: 1.4 }}
				>
					{help}
				</div>
			</div>
			<Inline gap="xs" className="shrink-0 items-baseline">
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
			</Inline>
		</Inline>
	);
}
