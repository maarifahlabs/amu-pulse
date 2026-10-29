import QRCode from "qrcode";

export const DEFAULT_UPI_ID = process.env.NEXT_PUBLIC_UPI_ID?.trim() || "amupulse@upi";
export const DEFAULT_PAYEE_NAME = process.env.NEXT_PUBLIC_UPI_PAYEE?.trim() || "AMU Pulse Elections";

export interface UpiOrderParams {
  orderNumber: string;
  amount: number;
  note: string;
  upiId?: string;
  payeeName?: string;
}

/**
 * Builds standard UPI URI for scanning with any UPI app
 * (Google Pay, PhonePe, Paytm, BHIM, Cred, Amazon Pay, etc.)
 */
export function buildUpiUri(params: UpiOrderParams): string {
  const upiId = params.upiId || DEFAULT_UPI_ID;
  const payee = params.payeeName || DEFAULT_PAYEE_NAME;
  const q = new URLSearchParams({
    pa: upiId,
    pn: payee,
    am: params.amount.toFixed(2),
    cu: "INR",
    tn: params.note.slice(0, 50),
    tr: params.orderNumber,
  });
  return `upi://pay?${q.toString()}`;
}

/**
 * Generates a base64 QR code data URL from a UPI URI.
 */
export async function generateUpiQrCode(upiUri: string): Promise<string> {
  return QRCode.toDataURL(upiUri, {
    width: 280,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}
