"use client";

import { Inline, Center } from "@/shared/ui/layout";

type ParamCheckboxRowProps = {
	icon: React.ReactNode;
	label: string;
	help: string;
	checked: boolean;
	onChange: (v: boolean) => void;
};

export function ParamCheckboxRow({ icon, label, help, checked, onChange }: ParamCheckboxRowProps) {
	return (
		<Inline
			align="start"
			gap="md"
			className="rounded-lg p-3"
			style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-line)" }}
		>
			<Center
				className="h-7 w-7 shrink-0 rounded-md"
				style={{ background: "var(--color-pitch)", color: "var(--color-ink-2)" }}
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
			<Center className="shrink-0">
				<input
					type="checkbox"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					style={{ width: 18, height: 18, accentColor: "var(--color-brand)", cursor: "pointer" }}
				/>
			</Center>
		</Inline>
	);
}
