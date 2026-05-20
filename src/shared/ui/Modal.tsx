"use client";

/**
 * shared/ui/Modal.tsx
 * Overlay base reutilizable. Cierra con Escape o click en backdrop.
 * Sin portal — se renderiza en el arbol de React actual (suficiente para admin).
 */

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type Props = {
	onClose: () => void;
	title?: string;
	size?: "sm" | "md" | "lg";
	children: ReactNode;
	className?: string;
};

const SIZE = {
	sm: "max-w-sm",
	md: "max-w-lg",
	lg: "max-w-2xl",
};

export function Modal({ onClose, title, size = "md", children, className }: Props) {
	const dialogRef = useRef<HTMLDivElement>(null);

	// Cerrar con Escape
	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose]);

	// Bloquear scroll del body mientras el modal esta abierto
	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, []);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			aria-modal="true"
			role="dialog"
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Panel */}
			<div
				ref={dialogRef}
				className={cn(
					"relative w-full bg-surface border border-line rounded-xl shadow-2xl",
					"flex flex-col max-h-[90vh] overflow-y-auto",
					SIZE[size],
					className,
				)}
			>
				{title && (
					<div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
						<h2 className="text-[15px] font-semibold text-ink">{title}</h2>
						<button
							onClick={onClose}
							className="w-7 h-7 grid place-items-center rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition"
							aria-label="Cerrar"
						>
							<X size={15} strokeWidth={2} />
						</button>
					</div>
				)}
				<div className="flex-1 min-h-0">{children}</div>
			</div>
		</div>
	);
}
