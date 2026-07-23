import { ReactNode } from "react";
import { headers } from "next/headers";
import { classifyHost } from "@/shared/tenant/host";
import PublicFooter from "@/shared/ui/PublicFooter";
import PublicNav from "@/shared/ui/PublicNav";

export default async function PublicLayout({ children }: { children: ReactNode }) {
	// Subdominio de org (miliga.talachastats.com): el OrgPublicShell
	// (org/[slug]/layout) es el ÚNICO chrome — su propio sidebar + topbar. El
	// nav/footer del apex y el offset `sm:ml-56` no aplican ahí; si se pintaran,
	// habría doble sidebar. Se detecta por host, la misma señal que usa proxy.ts
	// para reescribir el subdominio a /org/{slug}.
	//
	// Trade-off: leer headers() opta este layout (y todo el segmento público) a
	// render dinámico. Las páginas públicas ya consultan DB, así que el costo es
	// acotado — revisar si en el futuro se quiere cachear el apex de forma estática.
	const host = (await headers()).get("host");
	if (classifyHost(host).kind === "org") {
		return <div className="min-h-screen bg-pitch font-body">{children}</div>;
	}

	return (
		<div className="min-h-screen bg-pitch flex flex-col font-body">
			<PublicNav />
			<div className="flex-1 flex flex-col pt-14 sm:pt-0 sm:ml-56">
				{children}
				<PublicFooter />
			</div>
		</div>
	);
}
