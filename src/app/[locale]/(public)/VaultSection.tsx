import { getTranslations } from "next-intl/server";
import { Link } from "@/shared/i18n/navigation";
import { Archive, ChevronRight } from "lucide-react";

/* Nombres ficticios del mock — ejemplo ilustrativo, no prueba social */
const TEAMMATES = ["M. Chávez", "El Güero", "R. Ramírez", "J. Núñez", "+9 más"];

/**
 * "El baúl" — nostalgia anticipada (P15): un perfil visto 20 años después.
 * El gancho emocional es CON QUIÉN jugaste, no cuánto metiste.
 */
export default async function VaultSection() {
	const t = await getTranslations("home");

	return (
		<section className="bg-pitch border-t border-line px-5 py-16">
			<div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
				{/* ── Copy ── */}
				<div className="text-center lg:text-left">
					<p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-ink uppercase tracking-widest mb-3">
						<Archive size={13} strokeWidth={2} />
						{t("vaultSection.eyebrow")}
					</p>
					<h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-[0.95] tracking-tight mb-4">
						{t("vaultSection.titleLine1")}
						<br />
						<span className="text-brand-ink">{t("vaultSection.titleLine2")}</span>
					</h2>
					<p className="text-ink-2 text-base leading-relaxed max-w-md mx-auto lg:mx-0 mb-6">
						{t("vaultSection.body")}
					</p>
					<Link
						href="/players"
						className="inline-flex items-center gap-1.5 text-sm text-brand-ink hover:underline font-semibold"
					>
						{t("vaultSection.cta")}
						<ChevronRight size={14} strokeWidth={2} />
					</Link>
				</div>

				{/* ── Mock: perfil visto desde el futuro ── */}
				<div className="max-w-sm w-full mx-auto">
					<div className="bg-surface border border-line rounded-2xl p-5 sm:p-6">
						<div className="flex items-center justify-between mb-4">
							<p className="text-[11px] font-bold uppercase tracking-widest text-ink-3">
								Temporada 2026 · Liga de los Domingos
							</p>
							<span className="text-[10px] font-semibold bg-surface-2 border border-line text-ink-3 px-2 py-1 rounded-full whitespace-nowrap">
								{t("vaultSection.pill")}
							</span>
						</div>

						<p className="font-display font-black text-2xl text-ink uppercase leading-none mb-1">
							Deportivo Los Compas
						</p>
						<p className="text-sm text-ink-3 mb-4">12 goles · 3 asistencias · Subcampeón</p>

						<div className="border-t border-line pt-4">
							<p className="text-xs font-semibold text-ink-2 uppercase tracking-wider mb-2.5">
								{t("vaultSection.playedWith")}
							</p>
							<div className="flex flex-wrap gap-2">
								{TEAMMATES.map((name) => (
									<span
										key={name}
										className="text-xs font-semibold bg-brand/10 border border-brand/20 text-ink-2 px-2.5 py-1.5 rounded-full"
									>
										{name}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
