/**
 * shared/lib/email-templates.ts
 * Templates HTML para emails transaccionales de TalachaStats.
 *
 * Reglas:
 *  - HTML inline (sin CSS externo) para maxima compatibilidad con clientes de email
 *  - Responsive: funciona en Gmail desktop, Gmail mobile, Outlook
 *  - Sin librerias de templates — funciones puras que retornan string
 */

const BRAND_GREEN = "#16a34a";
const BRAND_DARK = "#111827";

function baseLayout(content: string): string {
	return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TalachaStats</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:28px;">&#9917;</span>
              <h1 style="margin:8px 0 0;font-size:20px;font-weight:800;color:${BRAND_DARK};letter-spacing:-0.5px;">
                TalachaStats
              </h1>
              <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Tu liga, en serio.</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                TalachaStats &mdash; Estadisticas para ligas locales de futbol
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ----------------------------------------------------------------------------
// Template 1: Verificacion de email (se envia al registrarse)
// ----------------------------------------------------------------------------

export type VerificationEmailParams = {
	name: string;
	verificationUrl: string;
};

export function verificationEmailHtml({ name, verificationUrl }: VerificationEmailParams): string {
	const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND_DARK};">
      Verifica tu correo
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Hola <strong>${name}</strong>, gracias por registrarte en TalachaStats.
      Haz clic en el boton para activar tu cuenta.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${verificationUrl}"
             style="display:inline-block;background-color:${BRAND_GREEN};color:#ffffff;
                    font-size:15px;font-weight:700;text-decoration:none;
                    padding:14px 32px;border-radius:10px;letter-spacing:0.2px;">
            Verificar mi cuenta
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5;">
      Si el boton no funciona, copia y pega este enlace en tu navegador:
    </p>
    <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
      <a href="${verificationUrl}" style="color:${BRAND_GREEN};">${verificationUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />

    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Este enlace expira en <strong>24 horas</strong>.
      Si no creaste esta cuenta, ignora este correo.
    </p>
  `;

	return baseLayout(content);
}

// ----------------------------------------------------------------------------
// Template 2: Confirmacion de liga verificada (se envia al aprobar manualmente)
// ----------------------------------------------------------------------------

export type VerifiedOrgEmailParams = {
	name: string;
	orgName: string;
	dashboardUrl: string;
};

export function verifiedOrgEmailHtml({
	name,
	orgName,
	dashboardUrl,
}: VerifiedOrgEmailParams): string {
	const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND_DARK};">
      &#127881; Tu liga fue verificada
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Hola <strong>${name}</strong>, <strong>${orgName}</strong> ya esta verificada en TalachaStats.
      Tus ligas y jugadores ahora aparecen en los rankings publicos.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${dashboardUrl}"
             style="display:inline-block;background-color:${BRAND_GREEN};color:#ffffff;
                    font-size:15px;font-weight:700;text-decoration:none;
                    padding:14px 32px;border-radius:10px;letter-spacing:0.2px;">
            Ir a mi panel
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />

    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Si tienes preguntas, respondenos a este correo.
    </p>
  `;

	return baseLayout(content);
}
