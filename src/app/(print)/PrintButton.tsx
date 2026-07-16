"use client";

/** Botón "Imprimir" flotante, oculto en `@media print` (docs/CEDULA-IMPRESA-SPEC.md §5). */
export function PrintButton() {
	return (
		<button type="button" className="print-btn" onClick={() => window.print()}>
			Imprimir
			<style jsx>{`
				.print-btn {
					position: fixed;
					top: 16px;
					right: 16px;
					z-index: 20;
					background: #0a0a0a;
					color: #fff;
					border: none;
					padding: 11px 20px;
					border-radius: 6px;
					font-family: var(--font-cedula-display, "Archivo"), sans-serif;
					font-size: 13px;
					font-weight: 800;
					letter-spacing: 0.04em;
					text-transform: uppercase;
					cursor: pointer;
					box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
				}
				.print-btn:hover {
					background: #000;
				}
				@media print {
					.print-btn {
						display: none;
					}
				}
			`}</style>
		</button>
	);
}
