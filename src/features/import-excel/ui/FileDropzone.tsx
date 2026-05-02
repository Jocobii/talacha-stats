"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";

type Props = {
	file: File | null;
	onFileChange: (file: File | null) => void;
};

export function FileDropzone({ file, onFileChange }: Props) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	// Drag state is purely visual — lives here, not in the wizard reducer
	const [dragOver, setDragOver] = useState(false);

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = () => setDragOver(false);

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		const f = e.dataTransfer.files[0];
		if (f) onFileChange(f);
	};

	return (
		<div>
			<div
				role="button"
				tabIndex={0}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={() => fileInputRef.current?.click()}
				onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
				className={[
					"rounded-2xl border-[2.5px] p-7 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-green-500",
					file
						? "border-brand border-solid bg-brand/10"
						: dragOver
							? "border-brand border-dashed bg-brand/10"
							: "border-line border-dashed hover:border-brand hover:bg-surface-2",
				].join(" ")}
			>
				{file ? (
					<div className="flex items-center justify-center gap-3">
						<span className="text-3xl">📄</span>
						<div className="text-left">
							<p className="text-[15px] font-bold text-brand">{file.name}</p>
							<p className="text-xs text-ink-2 mt-0.5">Archivo listo · Toca para cambiar</p>
						</div>
						<span className="text-2xl text-brand ml-2">✓</span>
					</div>
				) : (
					<div>
						<div className="text-4xl mb-2">📂</div>
						<p className="text-[15px] font-semibold text-ink mb-1">Arrastra tu archivo aquí</p>
						<p className="text-sm text-ink-3 mb-3">o haz clic para seleccionar</p>
						<span className="inline-block bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink">
							Seleccionar archivo .xlsx
						</span>
					</div>
				)}
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept=".xlsx,.xls"
				className="hidden"
				onChange={(e: ChangeEvent<HTMLInputElement>) => {
					const f = e.target.files?.[0];
					if (f) onFileChange(f);
				}}
			/>

			<div className="flex items-center gap-2 mt-2">
				<span className="text-xs text-ink-3">¿No tienes el formato correcto?</span>
				<a
					href="/api/import/templates/example"
					className="text-xs text-blue-300 font-semibold underline"
					download
				>
					Descargar formato de ejemplo
				</a>
			</div>
		</div>
	);
}
