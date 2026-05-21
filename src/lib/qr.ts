// src/lib/qr.ts
// QR kod üretici — SVG formatında, marka logosu destekli

import QRCode from "qrcode";

export interface QRCodeOptions {
  url: string;
  size?: number; // px, default 300
  color?: string; // hex, default "#000000"
  backgroundColor?: string; // hex, default "#ffffff"
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"; // H = logo eklenecekse H kullan
}

export interface QRCodeResult {
  svg: string;
  dataUrl: string; // PNG base64, indirme için
}

/**
 * SVG + PNG QR kodu üretir.
 * Restoran logosu eklemek için errorCorrectionLevel: 'H' kullanılmalı.
 */
export async function generateQRCode(
  options: QRCodeOptions
): Promise<QRCodeResult> {
  const {
    url,
    size = 300,
    color = "#000000",
    backgroundColor = "#ffffff",
    errorCorrectionLevel = "H",
  } = options;

  const qrOptions: QRCode.QRCodeToStringOptions = {
    type: "svg",
    width: size,
    margin: 2,
    color: {
      dark: color,
      light: backgroundColor,
    },
    errorCorrectionLevel,
  };

  const svg = await QRCode.toString(url, qrOptions);

  // PNG data URL (indirme / print için)
  const dataUrl = await QRCode.toDataURL(url, {
    width: size * 2, // 2x retina
    margin: 2,
    color: {
      dark: color,
      light: backgroundColor,
    },
    errorCorrectionLevel,
  });

  return { svg, dataUrl };
}

/**
 * UTM parametreli URL oluşturucu
 * QR kaynak takibi için kullanılır
 */
export function buildQRTargetUrl(params: {
  baseUrl: string;
  restaurantSlug: string;
  path?: string; // "/menu", "/kampanyalar" vb.
  utmSource?: string; // "qr"
  utmMedium?: string; // "table_card", "sticker"
  sourceKey?: string; // "table_5"
}): string {
  const {
    baseUrl,
    restaurantSlug,
    path = "/menu",
    utmSource = "qr",
    utmMedium,
    sourceKey,
  } = params;

  const url = new URL(`${baseUrl}/${restaurantSlug}${path}`);

  if (utmSource) url.searchParams.set("utm_source", utmSource);
  if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
  if (sourceKey) url.searchParams.set("src", sourceKey);

  return url.toString();
}

/**
 * Para birimi formatı (kuruş → TL string)
 * UI'da kullanmak için burada da tanımlandı
 */
export function formatPrice(kurus: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kurus / 100);
}
