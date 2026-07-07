import { getTranslations } from "next-intl/server";
import { Link } from "@/shared/i18n/navigation";
import { ChevronRight } from "lucide-react";

type StepMessage = { title: string; description: string };

/* O4 — gradiente de meta: el paso 1 se presenta casi-trivial y el progreso ya iniciado */
export default async function OrganizerSteps() {
	const t = await getTranslations("home");
	const steps = t.raw("organizerSteps.steps") as StepMessage[];

	return (
		<section className="bg-pitch border-t border-line px-5 py-16">
			<div className="max-w-3xl mx-auto">
				<h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-center mb-10">
					{t("organizerSteps.titlePrefix")}
					<span className="text-brand-ink">{t("organizerSteps.titleStrong")}</span>
				</h2>

				<ol className="flex flex-col sm:flex-row gap-8 sm:gap-4">
					{steps.map(({ title, description }, index) => (
						<li key={title} className="flex-1 flex sm:flex-col gap-4 sm:gap-3 items-start">
							<div className="flex sm:w-full items-center gap-3">
								<span className="w-10 h-10 rounded-full bg-brand/10 border-2 border-brand flex items-center justify-center font-display font-black text-brand-ink shrink-0">
									{index + 1}
								</span>
								{/* Conector entre pasos (solo desktop) */}
								{index < steps.length - 1 && (
									<span className="hidden sm:block flex-1 h-0.5 bg-line" aria-hidden="true" />
								)}
							</div>
							<div>
								<p className="font-bold text-ink text-sm mb-1">{title}</p>
								<p className="text-ink-3 text-sm leading-relaxed">{description}</p>
							</div>
						</li>
					))}
				</ol>

				<div className="flex justify-center mt-10">
					<Link
						href="/register"
						className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-7 py-3.5 rounded-xl text-sm transition font-body"
					>
						{t("organizerSteps.cta")}
						<ChevronRight size={16} strokeWidth={2} />
					</Link>
				</div>
			</div>
		</section>
	);
}
