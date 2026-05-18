"use client";

type CheckPillProps = {
	checked: boolean;
	onChange: () => void;
	label: string;
	danger?: boolean;
	disabled?: boolean;
};

function resolveStyles(checked: boolean, danger: boolean) {
	if (!checked) {
		return {
			background: "var(--color-surface-2)",
			border: "1px solid var(--color-line)",
			color: "var(--color-ink-3)",
		};
	}
	if (danger) {
		return {
			background: "rgba(248,113,113,0.12)",
			border: "1px solid rgba(248,113,113,0.35)",
			color: "#F87171",
		};
	}
	return {
		background: "rgba(0,230,118,0.12)",
		border: "1px solid rgba(0,230,118,0.35)",
		color: "var(--color-brand)",
	};
}

export function CheckPill({
	checked,
	onChange,
	label,
	danger = false,
	disabled = false,
}: CheckPillProps) {
	const styles = resolveStyles(checked, danger);

	return (
		<button
			type="button"
			onClick={disabled ? undefined : onChange}
			disabled={disabled}
			style={{
				width: 28,
				height: 28,
				borderRadius: 6,
				cursor: disabled ? "not-allowed" : "pointer",
				opacity: disabled ? 0.4 : 1,
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: 13,
				fontWeight: 700,
				transition: "background 0.15s, border-color 0.15s, color 0.15s",
				outline: "none",
				...styles,
			}}
			aria-label={label}
			aria-pressed={checked}
		>
			{label}
		</button>
	);
}
