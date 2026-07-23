/**
 * org/[slug]/not-found.tsx
 *
 * Landing de captación para un subdominio de org inexistente
 * (docs/SUBDOMINIOS-MULTITENANT.md §8, §9.2 — "propuesta: landing de
 * captación en vez de 404 seco", aceptada aquí; ajustable si Jocobi quiere
 * otro copy/diseño). Next renderiza este archivo para CUALQUIER notFound()
 * lanzado dentro del subárbol org/[slug]/* — org inexistente, liga
 * inexistente, jugador sin actividad en la org, etc.
 *
 * No recibe `params` (limitación de not-found.tsx) y NO puede asumir que el
 * layout pintó el shell — si la org no existe, layout.tsx no monta
 * OrgPublicShell (ver ese archivo), así que esta página es la única UI que
 * ve el visitante. Los links van absolutos al apex (getApexUrl): si el host
 * actual es un subdominio de org, un link relativo se reescribiría de vuelta
 * al mismo subárbol roto (ver el mismo patrón en OrgPublicShell/páginas
 * scoped).
 */

import { getTranslations } from "next-intl/server";
import { getApexUrl } from "@/shared/tenant/apex-url";

export default async function OrgNotFound() {
	const t = await getTranslations("org");
	const [homeHref, ctaHref] = await Promise.all([getApexUrl("/"), getApexUrl("/para-organizadores")]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-pitch text-ink px-5">
			<div className="max-w-sm text-center flex flex-col items-center gap-4">
				<span className="font-display font-black text-5xl text-brand-ink">?</span>
				<div>
					<h1 className="font-display font-black text-xl uppercase tracking-tight">
						{t("notFoundLanding.title")}
					</h1>
					<p className="text-sm text-ink-3 mt-1.5">{t("notFoundLanding.subtitle")}</p>
				</div>
				<div className="flex flex-col gap-2.5 w-full mt-2">
					{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- absoluto al apex a propósito, ver comentario arriba */}
					<a
						href={ctaHref}
						className="w-full text-center text-sm font-semibold bg-brand text-pitch rounded-xl px-4 py-2.5 hover:opacity-90 transition"
					>
						{t("notFoundLanding.cta")}
					</a>
					{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- absoluto al apex a propósito */}
					<a
						href={homeHref}
						className="w-full text-center text-xs text-ink-3 hover:text-ink transition"
					>
						{t("notFoundLanding.backHome")}
					</a>
				</div>
			</div>
		</div>
	);
}
