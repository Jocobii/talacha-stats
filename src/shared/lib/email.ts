/**
 * shared/lib/email.ts
 * Servicio de envio de emails transaccionales via Resend.
 *
 * Variables de entorno requeridas:
 *   RESEND_API_KEY  — API key de Resend (re_xxxx...)
 *   EMAIL_DOMAIN    — Dominio verificado en Resend. Ej: "talachastats.com".
 *                     De el se derivan todos los remitentes (support@, hello@, etc.).
 *   EMAIL_FROM      — (Opcional, legacy) Remitente por defecto si EMAIL_DOMAIN no esta.
 *                     Ej: "TalachaStats <noreply@tudominio.com>".
 *
 * Cada remitente corresponde a un proposito. Los que aceptan respuesta llevan
 * Reply-To para que las contestaciones caigan en el buzon correcto (via el
 * email routing de entrada configurado en Cloudflare). Los automaticos
 * (noreply, notifications) NO llevan Reply-To.
 */
import { Resend } from "resend";

/**
 * Registro de remitentes por proposito.
 *   local  — parte local de la direccion (antes de @dominio)
 *   name   — nombre visible del remitente
 *   reply  — si true, se agrega Reply-To para permitir respuestas del usuario
 */
export const EMAIL_SENDERS = {
	/** Ayuda a ligas y jugadores */
	support: { local: "support", name: "TalachaStats Soporte", reply: true },
	/** Contacto comercial y dudas generales */
	hello: { local: "hello", name: "TalachaStats", reply: true },
	/** Reporte de fallos de seguridad */
	security: { local: "security", name: "TalachaStats Seguridad", reply: true },
	/** Avisos del sistema (no se responde) */
	notifications: { local: "notifications", name: "TalachaStats", reply: false },
	/** Verificacion, recuperacion, invitaciones y demas correos automaticos */
	noreply: { local: "noreply", name: "TalachaStats", reply: false },
} as const;

export type EmailSender = keyof typeof EMAIL_SENDERS;

function getResend(): Resend {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("[email] RESEND_API_KEY no esta configurada. Agregala a .env.local");
	}
	return new Resend(apiKey);
}

/**
 * Resuelve el remitente (from) y el reply-to para un sender dado.
 * Deriva las direcciones de EMAIL_DOMAIN; si no esta, cae a EMAIL_FROM (legacy).
 */
function resolveSender(sender: EmailSender): { from: string; replyTo?: string } {
	const cfg = EMAIL_SENDERS[sender];
	const domain = process.env.EMAIL_DOMAIN?.trim();

	if (domain) {
		const address = `${cfg.local}@${domain}`;
		return {
			from: `${cfg.name} <${address}>`,
			replyTo: cfg.reply ? address : undefined,
		};
	}

	// Fallback legacy: un unico remitente configurado a mano.
	const legacy = process.env.EMAIL_FROM;
	if (legacy) {
		return { from: legacy };
	}

	throw new Error(
		"[email] Configura EMAIL_DOMAIN (ej: talachastats.com) o EMAIL_FROM en .env.local",
	);
}

export type SendEmailParams = {
	to: string;
	subject: string;
	html: string;
	/** Remitente por proposito. Default: "noreply". */
	sender?: EmailSender;
	/** Sobreescribe el Reply-To derivado del sender. */
	replyTo?: string;
};

/**
 * Envia un email transaccional via Resend.
 * Lanza un error si falla — el caller decide como manejarlo.
 */
export async function sendEmail({
	to,
	subject,
	html,
	sender = "noreply",
	replyTo,
}: SendEmailParams): Promise<void> {
	const resend = getResend();
	const { from, replyTo: derivedReplyTo } = resolveSender(sender);
	const finalReplyTo = replyTo ?? derivedReplyTo;

	const { error } = await resend.emails.send({
		from,
		to,
		subject,
		html,
		...(finalReplyTo ? { replyTo: finalReplyTo } : {}),
	});

	if (error) {
		console.error("[email] Error al enviar email a", to, error);
		throw new Error(`Error al enviar email: ${error.message}`);
	}
}
