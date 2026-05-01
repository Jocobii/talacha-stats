/**
 * shared/lib/email.ts
 * Servicio de envio de emails transaccionales via Resend.
 *
 * Variables de entorno requeridas:
 *   RESEND_API_KEY  — API key de Resend (re_xxxx...)
 *   EMAIL_FROM      — Direccion remitente verificada en Resend
 *                     ej: "TalachaStats <noreply@tudominio.com>"
 */
import { Resend } from "resend";

function getResend(): Resend {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("[email] RESEND_API_KEY no esta configurada. Agregala a .env.local");
	}
	return new Resend(apiKey);
}

function getFrom(): string {
	const from = process.env.EMAIL_FROM;
	if (!from) {
		throw new Error("[email] EMAIL_FROM no esta configurada. Ej: noreply@tudominio.com");
	}
	return from;
}

export type SendEmailParams = {
	to: string;
	subject: string;
	html: string;
};

/**
 * Envia un email transaccional via Resend.
 * Lanza un error si falla — el caller decide como manejarlo.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
	const resend = getResend();
	const from = getFrom();

	const { error } = await resend.emails.send({ from, to, subject, html });

	if (error) {
		console.error("[email] Error al enviar email a", to, error);
		throw new Error(`Error al enviar email: ${error.message}`);
	}
}
