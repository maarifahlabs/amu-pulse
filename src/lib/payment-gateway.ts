import QRCode from "qrcode";

export const DEFAULT_UPI_ID =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_UPI_ID) || "amupulse@upi";
export const DEFAULT_PAYEE_NAME =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_UPI_PAYEE) || "AMU Pulse Elections";
export const RAZORPAY_KEY_ID =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID) || "";

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

/**
 * Dynamically loads the official Razorpay Checkout SDK.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

/**
 * Opens Razorpay Checkout modal
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<boolean> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !(window as any).Razorpay) {
    throw new Error("Unable to load Razorpay payment gateway. Please check your network connection or use manual UPI.");
  }
  const rzp = new (window as any).Razorpay(options);
  rzp.open();
  return true;
}
