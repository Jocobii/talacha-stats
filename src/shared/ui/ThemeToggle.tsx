"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/shared/theme/ThemeProvider";

type Props = {
	/** Muestra solo el ícono, sin texto — para sidebar colapsado */
	iconOnly?: boolean;
};

export function ThemeToggle({ iconOnly = false }: Props) {
	const { mode, toggle } = useTheme();
	const isDark = mode === "dark";

	return (
		<button
			onClick={toggle}
			aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
			title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
			style={{
				display: "inline-flex",
				alignItems: "center",
				justifyContent: iconOnly ? "center" : undefined,
				gap: 6,
				width: iconOnly ? 36 : undefined,
				height: iconOnly ? 36 : undefined,
				background: "var(--color-surface-2)",
				border: "1px solid var(--color-line)",
				color: "var(--color-ink-2)",
				padding: iconOnly ? 0 : "7px 12px",
				borderRadius: 8,
				fontSize: 12,
				fontFamily: "var(--font-body)",
				fontWeight: 600,
				cursor: "pointer",
				transition: "color 0.15s, border-color 0.15s, background 0.15s",
				whiteSpace: "nowrap",
			}}
			onMouseEnter={(e) => {
				(e.currentTarget as HTMLButtonElement).style.color = "var(--color-ink)";
				(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-line-2)";
			}}
			onMouseLeave={(e) => {
				(e.currentTarget as HTMLButtonElement).style.color = "var(--color-ink-2)";
				(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-line)";
			}}
		>
			{isDark ? <Sun size={14} /> : <Moon size={14} />}
			{!iconOnly && (isDark ? "Claro" : "Oscuro")}
		</button>
	);
}
