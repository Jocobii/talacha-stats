/**
 * shared/brand/qr.ts
 * Genera un QR como data URL PNG para embeber en renders satori/ImageResponse.
 */
import QRCode from "qrcode";
import { BRAND_PALETTE } from "./palette";

type QrOptions = {
	width?: number;
};

export async function buildQrDataUrl(url: string, opts: QrOptions = {}): Promise<string | null> {
	const { width = 160 } = opts;
	return QRCode.toDataURL(url, {
		width,
		margin: 1,
		color: {
			dark: BRAND_PALETTE.brand,
			light: BRAND_PALETTE.bg,
		},
	});
}
