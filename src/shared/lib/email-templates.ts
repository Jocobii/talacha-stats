/**
 * shared/lib/email-templates.ts
 * Templates HTML para emails transaccionales de TalachaStats.
 *
 * Reglas:
 *  - HTML inline (sin CSS externo) para maxima compatibilidad con clientes de email
 *  - Responsive: funciona en Gmail desktop, Gmail mobile, Outlook
 *  - Sin librerias de templates — funciones puras que retornan string
 *  - Marca: paleta oscura + verde TalachaStats, wordmark Barlow Condensed,
 *    logo de barras construido con HTML (los clientes de email suelen bloquear SVG)
 */

import { BRAND_PALETTE } from "../brand/palette";
import { BRAND } from "../brand/tokens";

// Colores canonicos de marca (fuente unica: shared/brand/palette.ts)
const C = BRAND_PALETTE;
const BRAND_GREEN = C.brand; // #00e676
const BG = C.bg; // #0a0f0d
const SURFACE = C.surface; // #111814
const BORDER = C.border; // #1e2b23
const INK = C.ink; // #f0f4f2
const INK_DIM = C.inkDim; // #8a9e93
const INK_MUTED = C.inkMuted; // #4a5e53

// Stacks de fuente con fallbacks web-safe (Outlook ignora la fuente web)
const FONT_DISPLAY = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const FONT_BODY = "'Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

/**
 * Logo de barras + wordmark, construido con celdas HTML para renderizar en Gmail
 * (que descarta <svg>). Replica public/logo.svg.
 */
function brandHeader(): string {
	const bar = (h: number, opacity: number) =>
		`<td width="7" valign="bottom" style="padding:0 2px 0 0;">
       <div style="width:7px;height:${h}px;background-color:${BRAND_GREEN};opacity:${opacity};border-radius:2px;line-height:${h}px;font-size:0;">&nbsp;</div>
     </td>`;

	return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
      <tr>
        <td valign="bottom" style="padding-right:12px;">
          <table cellpadding="0" cellspacing="0" role="presentation" height="38"><tr>
            ${bar(12, 0.35)}${bar(22, 0.55)}${bar(31, 0.75)}${bar(38, 1)}${bar(28, 0.65)}
          </tr></table>
        </td>
        <td valign="bottom">
          <div style="font-family:${FONT_DISPLAY};font-weight:900;font-size:34px;line-height:34px;letter-spacing:-0.3px;">
            <span style="color:${INK};">Talacha</span><span style="color:${BRAND_GREEN};">Stats</span>
          </div>
        </td>
      </tr>
    </table>`;
}

function baseLayout(content: string): string {
	return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>TalachaStats</title>
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:${FONT_BODY};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${BG};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              ${brandHeader()}
              <p style="margin:12px 0 0;font-family:${FONT_BODY};font-size:13px;color:${INK_DIM};letter-spacing:0.2px;">${BRAND.tagline}</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${SURFACE};border:1px solid ${BORDER};border-radius:16px;padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-family:${FONT_BODY};font-size:11px;color:${INK_MUTED};">
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
    <h2 style="margin:0 0 8px;font-family:${FONT_DISPLAY};font-size:28px;font-weight:800;color:${INK};text-transform:uppercase;letter-spacing:-0.3px;">
      Verifica tu correo
    </h2>
    <p style="margin:0 0 24px;font-family:${FONT_BODY};font-size:15px;color:${INK_DIM};line-height:1.6;">
      Hola <strong style="color:${INK};">${name}</strong>, gracias por registrarte en TalachaStats.
      Haz clic en el boton para activar tu cuenta.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${verificationUrl}"
             style="display:inline-block;background-color:${BRAND_GREEN};color:${BG};
                    font-family:${FONT_BODY};font-size:15px;font-weight:700;text-decoration:none;
                    padding:14px 32px;border-radius:10px;letter-spacing:0.2px;">
            Verificar mi cuenta
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:13px;color:${INK_DIM};line-height:1.5;">
      Si el boton no funciona, copia y pega este enlace en tu navegador:
    </p>
    <p style="margin:0 0 24px;font-family:${FONT_BODY};font-size:12px;word-break:break-all;">
      <a href="${verificationUrl}" style="color:${BRAND_GREEN};">${verificationUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid ${BORDER};margin:0 0 20px;" />

    <p style="margin:0;font-family:${FONT_BODY};font-size:12px;color:${INK_MUTED};">
      Este enlace expira en <strong style="color:${INK_DIM};">24 horas</strong>.
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
    <h2 style="margin:0 0 8px;font-family:${FONT_DISPLAY};font-size:28px;font-weight:800;color:${INK};text-transform:uppercase;letter-spacing:-0.3px;">
      &#127881; Tu liga fue verificada
    </h2>
    <p style="margin:0 0 24px;font-family:${FONT_BODY};font-size:15px;color:${INK_DIM};line-height:1.6;">
      Hola <strong style="color:${INK};">${name}</strong>, <strong style="color:${INK};">${orgName}</strong> ya esta verificada en TalachaStats.
      Tus ligas y jugadores ahora aparecen en los rankings publicos.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${dashboardUrl}"
             style="display:inline-block;background-color:${BRAND_GREEN};color:${BG};
                    font-family:${FONT_BODY};font-size:15px;font-weight:700;text-decoration:none;
                    padding:14px 32px;border-radius:10px;letter-spacing:0.2px;">
            Ir a mi panel
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid ${BORDER};margin:0 0 20px;" />

    <p style="margin:0;font-family:${FONT_BODY};font-size:12px;color:${INK_MUTED};">
      Si tienes preguntas, respondenos a este correo.
    </p>
  `;

	return baseLayout(content);
}
