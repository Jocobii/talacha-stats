import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type PageShellProps = {
	/** Normalmente un `<PageHeader />`. */
	header?: ReactNode;
	/** Normalmente un `<LeagueTabBar />` / `<OrgTabBar />` u otra barra de acciones. */
	toolbar?: ReactNode;
	/** Panel lateral opcional — cuando está presente, `content` queda en una columna
	 *  flexible y `aside` en una columna fija a la derecha. */
	aside?: ReactNode;
	children: ReactNode;
	className?: string;
};

/** Shell de página admin: pone estructura/spacing para header+toolbar+contenido(+aside);
 *  la pantalla solo aporta los bloques. Reemplaza el layout manual repetido en cada
 *  `layout.tsx`/`page.tsx` de `/admin/*`. */
export function PageShell({ header, toolbar, aside, children, className }: PageShellProps) {
	return (
		<div className={cn("flex flex-col", className)}>
			{header}
			{toolbar}
			{aside ? (
				<div className="mt-4 flex flex-col gap-6 lg:flex-row">
					<div className="min-w-0 flex-1">{children}</div>
					<aside className="w-full shrink-0 lg:w-72">{aside}</aside>
				</div>
			) : (
				<div className="mt-4">{children}</div>
			)}
		</div>
	);
}
