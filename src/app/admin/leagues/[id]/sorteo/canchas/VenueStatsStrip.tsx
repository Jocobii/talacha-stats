"use client";

type MiniStatProps = {
	label: string;
	value: string;
	sub?: string;
	accent?: boolean;
};

export function MiniStat({ label, value, sub, accent }: MiniStatProps) {
	return (
		<div className="bg-surface border border-line rounded-xl px-3.5 py-2.5">
			<p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-3">{label}</p>
			<p
				className={`text-[26px] leading-none font-black mt-1.5 ${accent ? "text-brand" : "text-ink"}`}
				style={{ fontFamily: "var(--font-display)" }}
			>
				{value}
			</p>
			{sub && <p className="text-[11px] text-ink-3 mt-1">{sub}</p>}
		</div>
	);
}

export function parseMinutes(t: string): number {
	const [h, m] = t.split(":").map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
}
