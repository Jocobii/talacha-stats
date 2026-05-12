import { FileDown } from "lucide-react";

const TEMPLATES = [
	{
		label: "Goleadores",
		href: "https://docs.google.com/spreadsheets/d/1Xitma3k24YktKv1xS3qngNE5qgAXXJlE/edit?usp=sharing",
	},
	{
		label: "Tabla de posiciones",
		href: "https://docs.google.com/spreadsheets/d/1feOtF5ZmzDErwM6swC6g27RBRuxUnMkS/edit?usp=sharing",
	},
] as const;

/**
 * Links a los templates oficiales de importación.
 * Reutilizable en el importador y en el empty state de la liga.
 */
export function TemplateLinks() {
	return (
		<div className="flex items-center gap-3 flex-wrap">
			<span className="text-xs text-ink-3">¿No tienes el formato?</span>
			{TEMPLATES.map((t) => (
				<a
					key={t.label}
					href={t.href}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1 text-xs text-ink-2 hover:text-brand transition"
				>
					<FileDown size={12} strokeWidth={2} />
					{t.label}
				</a>
			))}
		</div>
	);
}
