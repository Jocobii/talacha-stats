import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

export function PageHeader({
	breadcrumb,
	title,
	subtitle,
	meta,
	actions,
}: {
	breadcrumb?: Crumb[];
	title: string;
	subtitle?: ReactNode;
	meta?: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<header className="flex flex-col gap-1 pb-6 border-b border-line">
			{breadcrumb && breadcrumb.length > 0 && (
				<nav className="flex items-center gap-1 text-[12px] text-ink-3">
					{breadcrumb.map((b, i) => (
						<span key={i} className="flex items-center gap-1">
							{i > 0 && <ChevronRight size={12} strokeWidth={2} className="text-ink-3/50" />}
							{b.href ? (
								<Link href={b.href} className="hover:text-ink-2 transition">
									{b.label}
								</Link>
							) : (
								<span className="text-ink-2">{b.label}</span>
							)}
						</span>
					))}
				</nav>
			)}
			<div className="flex flex-wrap items-end justify-between gap-4 mt-2">
				<div className="min-w-0">
					<h1 className="font-display text-3xl sm:text-[34px] font-black tracking-tight text-ink leading-none">
						{title}
					</h1>
					{(subtitle || meta) && (
						<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
							{subtitle && <span>{subtitle}</span>}
							{meta && (
								<>
									{subtitle && <span className="text-ink-3">·</span>}
									{meta}
								</>
							)}
						</div>
					)}
				</div>
				{actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
			</div>
		</header>
	);
}
