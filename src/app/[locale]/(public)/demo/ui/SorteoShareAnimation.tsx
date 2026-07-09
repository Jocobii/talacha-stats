"use client";

import { useTranslations } from "next-intl";
import { Shuffle, CheckCheck, MapPin } from "lucide-react";

/**
 * SorteoShareAnimation
 *
 * Animación en loop (CSS puro — sin estado ni timers, respeta AGENTS §7.2)
 * que simula: clic en "Generar sorteo" → aparecen los partidos →
 * clic en "Compartir a WhatsApp" → el mensaje vuela al grupo (✓✓ Enviado).
 *
 * Todo se posiciona en % dentro de un stage con aspect-ratio fijo, así el
 * cursor falso siempre cae sobre los botones a cualquier ancho.
 * Respeta prefers-reduced-motion mostrando el estado final estático.
 */

const PAIRINGS = [
	{ home: "Azteca", away: "Guerreros", venue: "La Bombonera", time: "19:00" },
	{ home: "Colonia", away: "América TJ", venue: "La Bombonera", time: "20:00" },
	{ home: "Tigres", away: "Galácticos", venue: "El Florido", time: "19:00" },
];

export function SorteoShareAnimation() {
	const t = useTranslations("demo");

	return (
		<div className="sshare">
			<style>{CSS}</style>

			{/* Encabezado */}
			<p className="sshare-eyebrow">● {t("sorteoAnim.eyebrow")}</p>
			<h2 className="sshare-title">{t("sorteoAnim.title")}</h2>
			<p className="sshare-sub">{t("sorteoAnim.subtitle")}</p>

			{/* Stage */}
			<div className="sshare-stage">
				{/* ── Panel de sorteo ── */}
				<div className="ss-console">
					<div className="ss-console-head">
						<Shuffle size={13} className="text-brand-ink" />
						<span>{t("sorteoAnim.panelTitle")}</span>
					</div>
				</div>

				{/* Rows de partidos */}
				{PAIRINGS.map((p, i) => (
					<div key={i} className={`ss-row ss-row-${i + 1}`}>
						<span className="ss-row-teams">
							{p.home} <em>vs</em> {p.away}
						</span>
						<span className="ss-row-meta">
							<MapPin size={9} /> {p.venue} · {p.time}
						</span>
					</div>
				))}

				{/* Botón generar */}
				<button className="ss-btn ss-btn-generate" tabIndex={-1} aria-hidden>
					<Shuffle size={13} />
					{t("sorteoAnim.generate")}
				</button>
				<span className="ss-ring ss-ring-gen" aria-hidden />

				{/* Botón compartir */}
				<button className="ss-btn ss-btn-share" tabIndex={-1} aria-hidden>
					<WhatsAppIcon />
					{t("sorteoAnim.share")}
				</button>
				<span className="ss-ring ss-ring-share" aria-hidden />

				{/* ── Teléfono / chat de WhatsApp ── */}
				<div className="ss-phone">
					<div className="ss-phone-head">
						<span className="ss-phone-avatar">⚽</span>
						<span className="ss-phone-name">{t("sorteoAnim.waGroup")}</span>
					</div>
					<div className="ss-phone-body">
						<div className="ss-wa-msg">
							<div className="ss-wa-card">
								<div className="ss-wa-card-top">
									<Shuffle size={10} />
									<span>J13</span>
								</div>
								{PAIRINGS.map((p, i) => (
									<div key={i} className="ss-wa-line">
										{p.home} <em>vs</em> {p.away}
									</div>
								))}
							</div>
							<p className="ss-wa-caption">{t("sorteoAnim.waCaption")}</p>
							<span className="ss-wa-time">
								21:04
								<span className="ss-wa-check ss-wa-check-read">
									<CheckCheck size={11} />
								</span>
							</span>
						</div>
						<span className="ss-wa-sent">
							<CheckCheck size={11} /> {t("sorteoAnim.sent")}
						</span>
					</div>
				</div>

				{/* Cursor falso */}
				<span className="ss-cursor" aria-hidden>
					<CursorIcon />
				</span>
			</div>
		</div>
	);
}

function WhatsAppIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
			<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.82c2.16 0 4.19.84 5.72 2.37a8.05 8.05 0 0 1 2.37 5.72c0 4.46-3.63 8.09-8.1 8.09a8.08 8.08 0 0 1-4.12-1.13l-.3-.18-3.06.8.82-2.98-.2-.31a8.02 8.02 0 0 1-1.26-4.29c0-4.46 3.63-8.09 8.1-8.09Zm-2.68 4.35c-.13 0-.34.05-.52.24-.18.2-.69.68-.69 1.65 0 .98.71 1.92.81 2.05.1.13 1.4 2.13 3.39 2.99.47.2.84.33 1.13.42.47.15.9.13 1.24.08.38-.06 1.17-.48 1.33-.94.16-.46.16-.86.11-.94-.05-.08-.18-.13-.38-.23-.2-.1-1.17-.58-1.35-.64-.18-.07-.31-.1-.44.1-.13.2-.5.64-.62.77-.11.13-.23.15-.42.05-.2-.1-.84-.31-1.6-.99-.59-.53-.99-1.18-1.11-1.38-.11-.2-.01-.31.09-.41.09-.09.2-.23.29-.35.1-.12.13-.2.2-.34.06-.13.03-.25-.02-.35-.05-.1-.44-1.08-.62-1.48-.16-.38-.33-.33-.44-.34l-.38-.01Z" />
		</svg>
	);
}

function CursorIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path
				d="M5 3l14 7.5-6.2 1.6L9.6 19 5 3z"
				fill="#fff"
				stroke="#0a0a0a"
				strokeWidth="1.4"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

// ── Estilos + keyframes (loop de 8s) ────────────────────────────────────────
const CSS = `
.sshare { font-family: var(--font-body); }
.sshare-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--color-brand-ink); }
.sshare-title { font-family: var(--font-display); font-weight: 900; text-transform: uppercase; font-size: 26px; line-height: 1; letter-spacing: -.01em; color: var(--color-ink); margin-top: 8px; }
.sshare-sub { font-size: 13px; color: var(--color-ink-2); margin-top: 6px; max-width: 460px; }

.sshare-stage {
  position: relative;
  width: 100%;
  max-width: 560px;
  aspect-ratio: 16 / 10;
  margin: 18px 0 4px;
  background: var(--color-pitch);
  border: 1px solid var(--color-line);
  border-radius: 16px;
  overflow: hidden;
}

/* Panel de sorteo (fondo) */
.ss-console { position: absolute; left: 3%; top: 5%; width: 55%; height: 90%; background: var(--color-surface-2); border: 1px solid var(--color-line); border-radius: 12px; }
.ss-console-head { display: flex; align-items: center; gap: 6px; padding: 9px 11px; font-family: var(--font-display); font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: .02em; color: var(--color-ink); border-bottom: 1px solid var(--color-line); }

/* Rows de partidos */
.ss-row { position: absolute; left: 6%; width: 49%; height: 12%; background: var(--color-surface); border: 1px solid var(--color-line); border-radius: 8px; padding: 0 8px; display: flex; flex-direction: column; justify-content: center; gap: 2px; opacity: 1; }
.ss-row-1 { top: 24%; } .ss-row-2 { top: 38%; } .ss-row-3 { top: 52%; }
.ss-row-teams { font-size: 11px; font-weight: 600; color: var(--color-ink); line-height: 1; }
.ss-row-teams em { font-style: normal; color: var(--color-ink-3); font-size: 9px; }
.ss-row-meta { display: flex; align-items: center; gap: 3px; font-size: 8.5px; color: var(--color-ink-3); }

/* Botones */
.ss-btn { position: absolute; left: 6%; width: 49%; height: 11%; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; border-radius: 8px; font-family: var(--font-body); font-weight: 700; font-size: 12px; cursor: default; }
.ss-btn-generate { top: 67%; background: var(--color-brand); color: #0a0a0a; }
.ss-btn-share { top: 82%; background: #25d366; color: #fff; opacity: 1; }

/* Anillos de clic */
.ss-ring { position: absolute; width: 34px; height: 34px; border-radius: 999px; border: 2px solid var(--color-brand); left: 28%; transform: translate(-50%, -50%) scale(.4); opacity: 0; pointer-events: none; }
.ss-ring-gen { top: 72.5%; border-color: var(--color-brand); }
.ss-ring-share { top: 87.5%; border-color: #25d366; }

/* Teléfono */
.ss-phone { position: absolute; left: 61%; top: 5%; width: 36%; height: 90%; background: #0b141a; border: 1px solid var(--color-line); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
.ss-phone-head { display: flex; align-items: center; gap: 6px; padding: 8px 9px; background: #1f2c33; }
.ss-phone-avatar { width: 20px; height: 20px; border-radius: 999px; background: #25d366; display: grid; place-items: center; font-size: 11px; }
.ss-phone-name { font-size: 11px; font-weight: 700; color: #e9edef; }
.ss-phone-body { position: relative; flex: 1; padding: 8px; }

/* Mensaje de WhatsApp */
.ss-wa-msg { position: absolute; right: 8px; left: 20%; bottom: 26px; background: #005c4b; border-radius: 8px 8px 2px 8px; padding: 6px; opacity: 1; }
.ss-wa-card { background: rgba(255,255,255,.08); border-radius: 5px; padding: 5px 6px; }
.ss-wa-card-top { display: flex; align-items: center; gap: 4px; font-size: 8px; font-weight: 800; color: #7ee2b8; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 3px; }
.ss-wa-line { font-size: 9px; color: #e9edef; line-height: 1.4; }
.ss-wa-line em { font-style: normal; color: #8fa3ad; }
.ss-wa-caption { font-size: 9px; color: #e9edef; margin-top: 4px; line-height: 1.3; }
.ss-wa-time { display: flex; align-items: center; justify-content: flex-end; gap: 2px; font-size: 8px; color: #8fa3ad; margin-top: 2px; }
.ss-wa-check { display: inline-flex; }
.ss-wa-check-read { color: #53bdeb; }
.ss-wa-sent { position: absolute; left: 8px; bottom: 8px; display: inline-flex; align-items: center; gap: 3px; font-size: 8.5px; font-weight: 700; color: #53bdeb; opacity: 1; }

/* Cursor */
.ss-cursor { position: absolute; left: 50%; top: 40%; filter: drop-shadow(0 2px 4px rgba(0,0,0,.4)); pointer-events: none; opacity: 0; }

/* ── Loop de 8s ── */
@media (prefers-reduced-motion: no-preference) {
  .ss-cursor { animation: ss-cursor 8s cubic-bezier(.4,0,.2,1) infinite; }
  .ss-btn-generate { animation: ss-press-gen 8s infinite; }
  .ss-btn-share { animation: ss-share-enable 8s infinite; }
  .ss-ring-gen { animation: ss-ring-gen 8s infinite; }
  .ss-ring-share { animation: ss-ring-share 8s infinite; }
  .ss-row-1 { animation: ss-row 8s infinite; animation-delay: -8s; }
  .ss-row-2 { animation: ss-row 8s infinite; animation-delay: -7.75s; }
  .ss-row-3 { animation: ss-row 8s infinite; animation-delay: -7.5s; }
  .ss-wa-msg { animation: ss-wa-send 8s infinite; }
  .ss-wa-check-read { animation: ss-wa-read 8s infinite; }
  .ss-wa-sent { animation: ss-wa-sent 8s infinite; }
}

@keyframes ss-cursor {
  0%   { left: 52%; top: 42%; opacity: 0; transform: scale(1); }
  4%   { opacity: 1; }
  14%  { left: 28%; top: 70%; transform: scale(1); }
  16%  { transform: scale(.82); }
  18%  { left: 28%; top: 70%; transform: scale(1); }
  36%  { left: 28%; top: 70%; }
  46%  { left: 28%; top: 85%; transform: scale(1); }
  49%  { transform: scale(.82); }
  51%  { transform: scale(1); }
  62%  { left: 74%; top: 66%; opacity: 1; }
  92%  { left: 74%; top: 66%; opacity: 1; }
  100% { left: 74%; top: 50%; opacity: 0; }
}
@keyframes ss-press-gen {
  0%, 14%, 100% { transform: scale(1); filter: brightness(1); }
  16% { transform: scale(.95); filter: brightness(1.12); }
  19% { transform: scale(1); filter: brightness(1); }
}
@keyframes ss-share-enable {
  0%, 30% { opacity: .4; transform: scale(1); }
  33% { opacity: 1; }
  47% { transform: scale(1); }
  49% { transform: scale(.95); filter: brightness(1.1); }
  52% { transform: scale(1); filter: brightness(1); }
  100% { opacity: 1; }
}
@keyframes ss-ring-gen {
  0%, 13% { opacity: 0; transform: translate(-50%,-50%) scale(.4); }
  15% { opacity: .7; }
  21% { opacity: 0; transform: translate(-50%,-50%) scale(1.7); }
  100% { opacity: 0; transform: translate(-50%,-50%) scale(.4); }
}
@keyframes ss-ring-share {
  0%, 47% { opacity: 0; transform: translate(-50%,-50%) scale(.4); }
  50% { opacity: .7; }
  56% { opacity: 0; transform: translate(-50%,-50%) scale(1.7); }
  100% { opacity: 0; transform: translate(-50%,-50%) scale(.4); }
}
@keyframes ss-row {
  0%, 16% { opacity: 0; transform: translateY(8px); }
  22% { opacity: 1; transform: translateY(0); }
  93% { opacity: 1; transform: translateY(0); }
  98%, 100% { opacity: 0; transform: translateY(8px); }
}
@keyframes ss-wa-send {
  0%, 54% { opacity: 0; transform: translateY(26px) scale(.94); }
  62% { opacity: 1; transform: translateY(0) scale(1); }
  93% { opacity: 1; transform: translateY(0) scale(1); }
  98%, 100% { opacity: 0; transform: translateY(0) scale(1); }
}
@keyframes ss-wa-read {
  0%, 66% { color: #8fa3ad; }
  70%, 100% { color: #53bdeb; }
}
@keyframes ss-wa-sent {
  0%, 64% { opacity: 0; transform: translateY(4px); }
  70% { opacity: 1; transform: translateY(0); }
  93% { opacity: 1; }
  98%, 100% { opacity: 0; }
}

/* Estado estático si el usuario reduce movimiento */
@media (prefers-reduced-motion: reduce) {
  .ss-cursor { opacity: 0; }
  .ss-ring { opacity: 0; }
  .ss-wa-sent { opacity: 1; }
}
`;
