import { getFormatter, getTranslations } from "next-intl/server";
import { getVisitStats } from "@/entities/analytics/queries";

export default async function PublicFooter() {
	const [{ totalUniqueVisitors }, t, format] = await Promise.all([
		getVisitStats().catch(() => ({ totalUniqueVisitors: 0 })),
		getTranslations("common"),
		getFormatter(),
	]);

	return (
		<footer className="bg-pitch border-t border-line px-5 py-5">
			<div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-ink-3 font-display uppercase tracking-widest text-center sm:text-left">
				<p>{t("footer.brand")}</p>
				<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
					<p>{t("footer.status")}</p>
					<p>
						{format.number(totalUniqueVisitors)} {t("footer.uniqueVisitors")}
					</p>
				</div>
			</div>
		</footer>
	);
}
