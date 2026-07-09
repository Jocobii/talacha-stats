"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/shared/i18n/navigation";

/** CTA de cierre del demo — registro directo, WhatsApp o correo. */
export function CtaFooter() {
	const t = useTranslations("demo");
	return (
		<div className="bg-pitch border-t border-line px-5 py-12">
			<div className="max-w-lg mx-auto text-center space-y-5">
				<div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-2 border border-line text-ink-2 px-3 py-1.5 rounded-full uppercase tracking-widest">
					{t("cta.eyebrow")}
				</div>
				<h2 className="font-display font-black text-4xl uppercase tracking-tight text-ink leading-tight">
					{t("cta.headline1")}
					<br />
					{t("cta.headlineFor")}{" "}
					<span className="text-brand-ink">{t("cta.headlineHighlight")}</span>?
				</h2>
				<p className="text-ink-2 text-sm leading-relaxed max-w-sm mx-auto">{t("cta.body")}</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
					<Link
						href="/register"
						className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-8 py-4 rounded-xl text-base transition"
					>
						{t("cta.register")}
						<ChevronRight size={16} strokeWidth={2} />
					</Link>
					<a
						href="https://wa.me/526647738664?text=Hola,%20quiero%20TalachaStats%20para%20mi%20liga"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center gap-2 bg-surface-2 hover:bg-line border border-line text-ink font-bold px-8 py-4 rounded-xl text-base transition"
					>
						{t("cta.whatsapp")}
					</a>
				</div>
				<a
					href="mailto:adalbertojocobi@gmail.com?subject=TalachaStats%20-%20mi%20liga"
					className="inline-block text-xs text-ink-3 hover:text-brand-ink underline underline-offset-2 pt-1"
				>
					{t("cta.email")}
				</a>
			</div>
		</div>
	);
}
