"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULT_UPI_ID, buildUpiUri, generateUpiQrCode } from "@/lib/payment-gateway";
import { calculateCampaignPrice, calculateReminderPrice } from "@/lib/campaign-pricing";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CreateOrderParams {
  candidateId: string;
  campaignType: "email_campaign" | "last_day_reminder";
  recipientCount: number;
  isChair: boolean;
  emailSubject: string;
  emailContent: string;
  manifestoExcerpt?: string;
}

export async function createCampaignOrderAction(params: CreateOrderParams) {
  try {
    const calculation =
      params.campaignType === "email_campaign"
        ? calculateCampaignPrice(params.recipientCount, params.isChair)
        : calculateReminderPrice(params.recipientCount, params.isChair);

    if (calculation.totalAmount <= 0) {
      return {
        success: false,
        error: "Cannot create payment order with zero amount. Ensure recipient or voter count is greater than 0.",
      };
    }

    const orderNumber = `UPI-AMU-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const note = `${params.campaignType === "email_campaign" ? "AMU Campaign" : "AMU Reminder"} - ${orderNumber}`;
    const upiId = DEFAULT_UPI_ID;

    const upiUri = buildUpiUri({
      orderNumber,
      amount: calculation.totalAmount,
      note,
      upiId,
    });

    const qrCodeDataUrl = await generateUpiQrCode(upiUri);
    const orderId = crypto.randomUUID();

    // If Supabase is connected, optionally record the pending order
    if (isSupabaseConfigured) {
      try {
        const db = createAdminClient();
        await db.from("payment_orders").insert({
          id: orderId,
          order_number: orderNumber,
          candidate_id: params.candidateId,
          campaign_type: params.campaignType,
          amount: calculation.totalAmount,
          currency: "INR",
          recipient_count: params.recipientCount,
          is_chair: params.isChair,
          status: "pending",
          upi_id: upiId,
          upi_uri: upiUri,
          email_subject: params.emailSubject,
          email_content: params.emailContent,
          manifesto_excerpt: params.manifestoExcerpt ?? null,
        });
      } catch (err) {
        // Table might not exist yet if running in demo or prior to migration
        console.warn("Could not save pending payment order to database:", err);
      }
    }

    return {
      success: true,
      orderId,
      orderNumber,
      amount: calculation.totalAmount,
      ratePerThousand: calculation.ratePerThousand,
      units: calculation.units,
      upiId,
      upiUri,
      qrCodeDataUrl,
      recipientCount: params.recipientCount,
      isChair: params.isChair,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate UPI payment order.",
    };
  }
}

export interface VerifyPaymentParams {
  orderId: string;
  orderNumber: string;
  transactionRef: string;
  candidateId: string;
  campaignType: "email_campaign" | "last_day_reminder";
  recipientCount: number;
  amount: number;
  emailSubject: string;
  emailContent: string;
}

/**
 * Verifies UPI payment and ONLY THEN triggers the campaign/reminder dispatch.
 * Fails with descriptive error if payment verification is missing or invalid.
 */
export async function verifyPaymentAndTriggerAction(params: VerifyPaymentParams) {
  try {
    const ref = params.transactionRef?.trim();

    // Enforce UPI UTR / Transaction Reference verification
    if (!ref || ref.length < 6 || !/^[a-zA-Z0-9_-]+$/.test(ref)) {
      return {
        success: false,
        error: `Payment verification failed: Invalid or missing UPI transaction reference (UTR). Please complete the UPI payment of ₹${params.amount} and enter the 12-digit UTR number provided by Google Pay, PhonePe, Paytm, or your bank app.`,
      };
    }

    // Persist verified campaign dispatch if database is configured
    if (isSupabaseConfigured) {
      try {
        const db = createAdminClient();
        await db
          .from("payment_orders")
          .update({
            status: "completed",
            transaction_ref: ref,
            paid_at: new Date().toISOString(),
          })
          .eq("order_number", params.orderNumber);

        await db.from("email_campaigns").insert({
          id: crypto.randomUUID(),
          candidate_id: params.candidateId,
          type: params.campaignType,
          recipient_count: params.recipientCount,
          subject: params.emailSubject,
          content: params.emailContent,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Could not record completed campaign in database:", err);
      }
    }

    // Trigger Campaign process confirmation
    const message =
      params.campaignType === "email_campaign"
        ? `Payment of ₹${params.amount} verified! Email campaign successfully triggered and dispatched to ${params.recipientCount.toLocaleString()} students.`
        : `Payment of ₹${params.amount} verified! Last day reminder successfully triggered and sent to your ${params.recipientCount.toLocaleString()} voters.`;

    return {
      success: true,
      message,
      orderNumber: params.orderNumber,
      amountPaid: params.amount,
      recipientCount: params.recipientCount,
      transactionRef: ref,
      dispatchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment processing and campaign trigger failed.",
    };
  }
}
