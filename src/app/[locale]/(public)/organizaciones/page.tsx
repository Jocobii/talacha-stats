import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2 } from "lucide-react";
import { listOrganizationsPublicPaginated } from "@/entities/organization";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates } from "@/shared/i18n/seo";
import { OrgDirectory } from "@/features/org-directory";

type OrganizacionesPageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: OrganizacionesPageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "organizaciones" });
	const appLocale = isAppLocale(locale) ? locale : "es";

	return {
		title: t("meta.title"),
		description: t("meta.description"),
		alternates: buildLocaleAlternates(appLocale, "/organizaciones"),
		// Sin `openGraph` propio: hereda el objeto completo del layout raíz
		// (ya localizado) — ver nota en app/[locale]/(public)/page.tsx.
	};
}

export default async function OrganizacionesPage({ params }: OrganizacionesPageProps) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("organizaciones");

	// Solo para el contador del hero — el listado real (filtros/paginado) vive
	// 100% en el cliente (features/org-directory, TanStack Query, §7.3b).
	const { total } = await listOrganizationsPublicPaginated({
		sort: "name_asc",
		limit: 1,
		offset: 0,
	});

	return (
		<div className="text-ink flex flex-col flex-1 bg-pitch">
			{/* ── Header ── */}
			<header className="relative px-5 pt-8 pb-0 max-w-6xl mx-auto w-full overflow-hidden">
				<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
					<svg
						className="absolute inset-0 w-full h-full"
						xmlns="http://www.w3.org/2000/svg"
						preserveAspectRatio="xMidYMid slice"
					>
						<circle
							cx="88%"
							cy="50%"
							r="80"
							fill="none"
							stroke="#00E676"
							strokeWidth="1"
							opacity="0.07"
						/>
						<circle
							cx="88%"
							cy="50%"
							r="40"
							fill="none"
							stroke="#00E676"
							strokeWidth="0.8"
							opacity="0.05"
						/>
					</svg>
					<div
						style={{
							position: "absolute",
							top: "-30%",
							right: "-15%",
							width: "55%",
							height: "160%",
							background:
								"radial-gradient(ellipse at center, rgba(0,230,118,0.07) 0%, transparent 65%)",
						}}
					/>
				</div>

				<div className="relative z-10 pb-6">
					<div className="flex items-center gap-2 mb-1">
						<Building2 size={24} className="text-brand-ink" strokeWidth={2} />
						<h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
							{t("title")}
						</h1>
					</div>
					<p className="text-ink-2 text-sm mt-1">{t("organizations", { count: total })}</p>
				</div>
			</header>

			{/* ── Contenido (cliente: filtros + paginado) ── */}
			<div className="flex-1 bg-surface rounded-t-3xl px-4 pt-5 pb-16">
				<div className="max-w-6xl mx-auto">
					<OrgDirectory />
				</div>
			</div>
		</div>
	);
}
