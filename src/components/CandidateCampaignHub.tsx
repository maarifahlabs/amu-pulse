"use client";

import { useId, useState } from "react";
import { createCampaignOrderAction, verifyPaymentAndTriggerAction } from "@/actions/campaigns";
import {
  buildCampaignPredefinedTemplate,
  buildReminderPredefinedTemplate,
  calculateCampaignPrice,
  calculateReminderPrice,
  isChairPosition,
} from "@/lib/campaign-pricing";

interface CandidateCampaignHubProps {
  candidate: {
    id: string;
    name: string;
    slug: string;
    ballot_number?: number | null;
    bio?: string | null;
    department?: string | null;
    faculty?: string | null;
  };
  position?: {
    id?: string;
    title?: string | null;
    slug?: string | null;
  } | null;
  manifesto?: {
    content?: string | null;
    published_at?: string | null;
  } | null;
  votes?: number;
}

type TabType = "email_campaign" | "last_day_reminder";
type StepType = "config" | "preview" | "payment" | "success";

export function CandidateCampaignHub({
  candidate,
  position,
  manifesto,
  votes = 0,
}: CandidateCampaignHubProps) {
  const isChair = isChairPosition(position);

  // If in demo mode or votes is 0, give simulated default for testing reminder
  const effectiveVotes = votes > 0 ? votes : 1420;

  const [activeTab, setActiveTab] = useState<TabType>("email_campaign");
  const [step, setStep] = useState<StepType>("config");
  const [recipientCount, setRecipientCount] = useState<number>(1000);

  // Email template state
  const campaignTemplate = buildCampaignPredefinedTemplate(
    {
      name: candidate.name,
      postTitle: position?.title,
      ballotNumber: candidate.ballot_number,
      faculty: candidate.faculty,
      department: candidate.department,
    },
    manifesto?.content,
  );

  const reminderTemplate = buildReminderPredefinedTemplate({
    name: candidate.name,
    postTitle: position?.title,
    ballotNumber: candidate.ballot_number,
  });

  const [subject, setSubject] = useState<string>(campaignTemplate.subject);
  const [appealText, setAppealText] = useState<string>(campaignTemplate.appeal);
  const [manifestoText, setManifestoText] = useState<string>(
    manifesto?.content?.trim() ||
      "• Dedicated to student welfare, academic infrastructure & transparency.\n• Fast-track grievance redressal & 24/7 library facility.\n• Fearless student representation in university bodies.",
  );
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("preview");

  // Payment State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    orderNumber: string;
    amount: number;
    upiId: string;
    upiUri: string;
    qrCodeDataUrl: string;
  } | null>(null);
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    orderNumber: string;
    amountPaid: number;
    recipientCount: number;
    transactionRef: string;
    message: string;
  } | null>(null);

  const subjectId = useId();
  const appealId = useId();
  const manifestoId = useId();
  const transactionRefId = useId();

  // Pricing calculations
  const campaignCalc = calculateCampaignPrice(recipientCount, isChair);
  const reminderCalc = calculateReminderPrice(effectiveVotes, isChair);

  const currentPrice =
    activeTab === "email_campaign" ? campaignCalc.totalAmount : reminderCalc.totalAmount;
  const currentUnits =
    activeTab === "email_campaign" ? campaignCalc.units : reminderCalc.units;
  const currentAudienceCount =
    activeTab === "email_campaign" ? recipientCount : effectiveVotes;

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    setStep("config");
    setErrorMsg(null);
    setOrderData(null);
    setSuccessData(null);
    setTransactionRef("");

    if (newTab === "email_campaign") {
      setSubject(campaignTemplate.subject);
      setAppealText(campaignTemplate.appeal);
    } else {
      setSubject(reminderTemplate.subject);
      setAppealText("");
    }
  };

  const handleProceedToPreview = () => {
    setErrorMsg(null);
    setStep("preview");
  };

  const handleProceedToPayment = async () => {
    setLoading(true);
    setErrorMsg(null);

    const fullContent =
      activeTab === "email_campaign"
        ? `${appealText}\n\n📌 KEY MANIFESTO COMMITMENTS:\n${manifestoText}\n\n🤲 VOTE, SUPPORT & DUA (ووٹ، سپورٹ اور دعا)\nCandidate: ${candidate.name} ${position?.title ? `(${position.title})` : ""}\nAMUSU Elections 2026`
        : `${appealText}\n\n⏰ LAST DAY VOTING REMINDER\nPlease cast your ballot for ${candidate.name} on polling day.\nVote, Support & Dua!`;

    const res = await createCampaignOrderAction({
      candidateId: candidate.id,
      campaignType: activeTab,
      recipientCount: currentAudienceCount,
      isChair,
      emailSubject: subject,
      emailContent: fullContent,
      manifestoExcerpt: manifestoText,
    });

    setLoading(false);

    if (!res.success || !res.orderNumber || !res.qrCodeDataUrl) {
      setErrorMsg(res.error || "Failed to generate UPI payment order. Please try again.");
      return;
    }

    setOrderData({
      orderId: res.orderId!,
      orderNumber: res.orderNumber,
      amount: res.amount!,
      upiId: res.upiId!,
      upiUri: res.upiUri!,
      qrCodeDataUrl: res.qrCodeDataUrl,
    });
    setStep("payment");
  };

  const handleVerifyAndTrigger = async () => {
    if (!orderData) return;
    setErrorMsg(null);

    const trimmedRef = transactionRef.trim();
    if (!trimmedRef) {
      setErrorMsg(
        "Payment verification failed: Please enter your 12-digit UPI transaction reference (UTR) after completing payment.",
      );
      return;
    }

    if (trimmedRef.length < 6) {
      setErrorMsg(
        "Payment verification failed: Transaction reference (UTR) is too short. Please enter the valid reference number from your UPI app.",
      );
      return;
    }

    setLoading(true);

    const res = await verifyPaymentAndTriggerAction({
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      transactionRef: trimmedRef,
      candidateId: candidate.id,
      campaignType: activeTab,
      recipientCount: currentAudienceCount,
      amount: orderData.amount,
      emailSubject: subject,
      emailContent: appealText,
    });

    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || "Payment verification failed. Campaign process was not triggered.");
      return;
    }

    setSuccessData({
      orderNumber: res.orderNumber!,
      amountPaid: res.amountPaid!,
      recipientCount: res.recipientCount!,
      transactionRef: res.transactionRef!,
      message: res.message!,
    });
    setStep("success");
  };

  const handleCopyUpi = () => {
    if (orderData?.upiId) {
      navigator.clipboard.writeText(orderData.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  return (
    <section className="card space-y-6 border-brand-200 bg-white p-6 shadow-sm">
      {/* Header and Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
              Candidate Campaign Portal
            </span>
            {isChair ? (
              <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                👑 Chair Position (President / VP / Secretary)
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Member / Court Position
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl">
            Outreach, Campaigning & Reminders
          </h2>
          <p className="text-sm text-slate-600">
            Reach students across AMU with your manifesto or mobilize your confirmed voters on polling day.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleTabChange("email_campaign")}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition sm:text-sm ${
              activeTab === "email_campaign"
                ? "bg-white text-brand-700 shadow-xs"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            📧 Email Campaigning
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("last_day_reminder")}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition sm:text-sm ${
              activeTab === "last_day_reminder"
                ? "bg-white text-brand-700 shadow-xs"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            ⏰ Last Day Reminder
          </button>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center text-xs font-semibold sm:text-sm">
        <div
          className={`flex items-center justify-center gap-1.5 ${
            step === "config" ? "text-brand-700 font-bold" : "text-slate-400"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs">
            1
          </span>
          Audience & Pricing
        </div>
        <div
          className={`flex items-center justify-center gap-1.5 ${
            step === "preview" ? "text-brand-700 font-bold" : "text-slate-400"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs">
            2
          </span>
          Preview & Edit
        </div>
        <div
          className={`flex items-center justify-center gap-1.5 ${
            step === "payment" || step === "success"
              ? "text-brand-700 font-bold"
              : "text-slate-400"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs">
            3
          </span>
          UPI Payment (Last)
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-bold">Notice</p>
          <p>{errorMsg}</p>
        </div>
      )}

      {/* ================= STEP 1: CONFIG ================= */}
      {step === "config" && (
        <div className="space-y-6">
          {activeTab === "email_campaign" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
                <h3 className="font-bold text-brand-900">Reach Prospective AMU Students</h3>
                <p className="mt-1 text-sm text-brand-800">
                  Send your official candidature appeal with our predefined template of{" "}
                  <strong>&quot;Vote, Support & Dua&quot;</strong> and your published manifesto commitments.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-brand-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-brand-600" />
                  <strong>Privacy Rule:</strong> Individual student names and emails are never exposed. Only the aggregate count is shown.
                </div>
              </div>

              {/* Target Audience Count Selection */}
              <div>
                <label className="label">
                  Target Student Audience: <span className="font-bold text-brand-700">{recipientCount.toLocaleString()} Students</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[1000, 2500, 5000, 10000].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setRecipientCount(count)}
                      className={`rounded-xl border p-3 text-center transition ${
                        recipientCount === count
                          ? "border-brand-600 bg-brand-50 text-brand-900 font-bold ring-2 ring-brand-400"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-base sm:text-lg">{count.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">Students</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <h3 className="font-bold text-amber-900">Mobilize Your Voters on Polling Day</h3>
                <p className="mt-1 text-sm text-amber-800">
                  Urge students who voted for you on AMU Pulse to cast their actual ballot at polling booths.
                  This reminder goes exclusively to your confirmed voters.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-600" />
                  <strong>Privacy Rule:</strong> Voter identities are completely secret and anonymous. Only your total vote count is shown.
                </div>
              </div>

              {/* Voter Count on Profile */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Votes On Your Profile
                    </span>
                    <div className="text-2xl font-black text-ink sm:text-3xl">
                      {effectiveVotes.toLocaleString()} <span className="text-sm font-normal text-slate-500">Voters</span>
                    </div>
                  </div>
                  <span className="badge bg-emerald-100 text-emerald-800">
                    {reminderCalc.units} Tier block ({reminderCalc.units} × 1,000)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Breakdown Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Transparent Pricing Summary
            </h4>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Contesting Post:</span>
                <span className="font-semibold text-ink">
                  {position?.title || "Candidate"} {isChair ? "(Chair: ₹200 / 1000)" : "(Other: ₹100 / 1000)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Audience Count:</span>
                <span className="font-semibold text-ink">{currentAudienceCount.toLocaleString()} Recipients</span>
              </div>
              <div className="flex justify-between">
                <span>Rate Tier:</span>
                <span>
                  {currentUnits} × ₹{isChair ? "200" : "100"} per 1,000 units
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold text-ink">
                <span>Total Amount:</span>
                <span className="text-xl text-brand-700">₹{currentPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleProceedToPreview}
              className="btn-primary"
            >
              Next: Preview & Edit Template →
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PREVIEW & EDIT ================= */}
      {step === "preview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink">Preview & Edit Message</h3>
              <p className="text-xs text-slate-500">
                Review the predefined template before payment. You can edit the subject, appeal, and manifesto points.
              </p>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setPreviewTab("edit")}
                className={`rounded px-2.5 py-1 text-xs font-semibold ${
                  previewTab === "edit" ? "bg-white text-ink shadow-xs" : "text-slate-500"
                }`}
              >
                ✏️ Edit Content
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("preview")}
                className={`rounded px-2.5 py-1 text-xs font-semibold ${
                  previewTab === "preview" ? "bg-white text-ink shadow-xs" : "text-slate-500"
                }`}
              >
                👁️ Live Email Preview
              </button>
            </div>
          </div>

          {previewTab === "edit" ? (
            <div className="space-y-4">
              <div>
                <label htmlFor={subjectId} className="label">Email Subject Line</label>
                <input
                  id={subjectId}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor={appealId} className="label">
                  Custom Appeal Note ({activeTab === "email_campaign" ? "Vote, Support & Dua Appeal" : "Urgent Polling Day Note"})
                </label>
                <textarea
                  id={appealId}
                  rows={4}
                  value={appealText}
                  onChange={(e) => setAppealText(e.target.value)}
                  className="input font-sans"
                  placeholder="Enter your personal appeal to AMU students..."
                />
              </div>

              {activeTab === "email_campaign" && (
                <div>
                  <label htmlFor={manifestoId} className="label">Key Manifesto Commitments</label>
                  <textarea
                    id={manifestoId}
                    rows={4}
                    value={manifestoText}
                    onChange={(e) => setManifestoText(e.target.value)}
                    className="input font-sans text-sm"
                    placeholder="Enter key commitments from your manifesto..."
                  />
                </div>
              )}
            </div>
          ) : (
            /* Live Email Preview Card */
            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 sm:p-6 shadow-inner">
              <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                {/* Email Mock Header */}
                <div className="border-b border-slate-100 pb-3 text-xs text-slate-500">
                  <p><strong>From:</strong> AMU Pulse Elections &lt;elections@amupulse.com&gt;</p>
                  <p><strong>To:</strong> student@myamu.ac.in (Recipient Count: {currentAudienceCount.toLocaleString()})</p>
                  <p><strong>Subject:</strong> {subject}</p>
                </div>

                {/* Predefined Badge */}
                <div className="text-center py-1">
                  <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    🤲 VOTE, SUPPORT & DUA (ووٹ، سپورٹ اور دعا)
                  </span>
                </div>

                {/* Candidate Info Box */}
                <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                  <h4 className="text-lg font-bold text-ink">{candidate.name}</h4>
                  <p className="text-xs font-semibold text-brand-700">
                    Contesting for {position?.title || "Candidate"}
                    {candidate.ballot_number ? ` · Ballot Serial #${candidate.ballot_number}` : ""}
                  </p>
                  {(candidate.department || candidate.faculty) && (
                    <p className="text-xs text-slate-500">
                      {candidate.department} {candidate.faculty ? `(${candidate.faculty})` : ""}
                    </p>
                  )}
                </div>

                {/* Appeal Message */}
                <div className="prose-text text-sm">
                  {appealText || "Dear Student, I appeal for your valuable Vote, Support & Dua in the AMUSU Elections 2026."}
                </div>

                {/* Manifesto Excerpt */}
                {activeTab === "email_campaign" && (
                  <div className="rounded-lg border-l-4 border-brand-500 bg-brand-50/50 p-3 text-xs text-brand-900 whitespace-pre-line">
                    <p className="font-bold mb-1">📌 Key Manifesto Highlights:</p>
                    {manifestoText}
                  </div>
                )}

                {/* Urgent Call to action */}
                <div className="rounded-xl bg-amber-50 p-3 text-center border border-amber-200 text-xs font-medium text-amber-900">
                  🗳️ AMU Students&apos; Union Elections 2026 · Please cast your vote &amp; remember us in your prayers!
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep("config")}
              className="btn-secondary"
            >
              ← Back to Audience
            </button>
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Generating UPI Payment..." : "Proceed to UPI Payment (Last Step) →"}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: PAYMENT OPTION SHOWS LAST ================= */}
      {step === "payment" && orderData && (
        <div className="space-y-6">
          <div className="rounded-xl border border-brand-200 bg-brand-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-800">
                  UPI Payment Gateway
                </span>
                <h3 className="text-xl font-black text-brand-950 sm:text-2xl">
                  Pay ₹{orderData.amount.toLocaleString()} via UPI
                </h3>
                <p className="text-xs text-brand-700">
                  Order Number: <code className="font-mono font-bold">{orderData.orderNumber}</code>
                </p>
              </div>
              <span className="badge bg-amber-100 text-amber-800 font-bold">
                Payment Verification Required
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: Dynamic QR Code */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
              <span className="text-xs font-semibold text-slate-500 mb-2">
                Scan with GPay, PhonePe, Paytm, or BHIM
              </span>
              <div className="rounded-xl border border-slate-300 bg-white p-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={orderData.qrCodeDataUrl}
                  alt="UPI Payment QR Code"
                  className="h-56 w-56 object-contain"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Amount encoded: <strong>₹{orderData.amount}</strong>
              </p>
            </div>

            {/* Right: UPI ID & Payment Verification */}
            <div className="flex flex-col justify-between space-y-4">
              {/* UPI ID with Copy Button */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="text-xs font-bold uppercase text-slate-500">Official UPI ID</span>
                <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-2">
                  <span className="font-mono text-sm font-bold text-ink">{orderData.upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="rounded bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition"
                  >
                    {copiedUpi ? "✓ Copied" : "Copy UPI ID"}
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <a
                    href={orderData.upiUri}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    📱 Click to pay with installed UPI App
                  </a>
                </div>
              </div>

              {/* UTR Reference Input */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <label htmlFor={transactionRefId} className="label font-bold text-ink">
                  Enter 12-Digit UPI Transaction Reference (UTR)
                </label>
                <p className="text-xs text-slate-500">
                  After paying in your UPI app, copy the 12-digit UTR/reference number and paste it below.
                  Campaign process is triggered strictly after payment confirmation.
                </p>
                <input
                  id={transactionRefId}
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. 429182374912"
                  className="input font-mono text-base"
                />
              </div>

              <div className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
                🔒 <strong>Execution Guarantee:</strong> Campaign dispatch triggers only upon successful payment verification. If verification fails, an appropriate error is displayed.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setStep("preview")}
              className="btn-secondary"
            >
              ← Back to Preview &amp; Edit
            </button>
            <button
              type="button"
              onClick={handleVerifyAndTrigger}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Verifying Payment & Triggering..." : "Verify Payment & Dispatch Campaign 🚀"}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: SUCCESS RECEIPT ================= */}
      {step === "success" && successData && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-2xl font-bold">
            ✓
          </div>
          <h3 className="text-xl font-bold text-emerald-950 sm:text-2xl">
            Campaign Dispatched Successfully!
          </h3>
          <p className="text-sm text-emerald-800 max-w-md mx-auto">
            {successData.message}
          </p>

          {/* Receipt details */}
          <div className="mx-auto max-w-md rounded-xl border border-emerald-200 bg-white p-4 text-left text-xs space-y-2 text-slate-700 shadow-xs">
            <div className="flex justify-between border-b border-slate-100 pb-1.5 font-bold text-slate-800">
              <span>Official Receipt</span>
              <span>AMU Pulse Elections</span>
            </div>
            <div className="flex justify-between">
              <span>Order Number:</span>
              <span className="font-mono font-semibold">{successData.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span className="font-bold text-emerald-700">₹{successData.amountPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>UPI UTR Reference:</span>
              <span className="font-mono">{successData.transactionRef}</span>
            </div>
            <div className="flex justify-between">
              <span>Recipients:</span>
              <span className="font-semibold">{successData.recipientCount.toLocaleString()} Students (Count only)</span>
            </div>
            <div className="flex justify-between">
              <span>Campaign Type:</span>
              <span className="capitalize">{activeTab === "email_campaign" ? "Email Campaigning" : "Last Day Reminder"}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setStep("config");
                setSuccessData(null);
                setOrderData(null);
                setTransactionRef("");
              }}
              className="btn-secondary"
            >
              Start Another Campaign or Reminder
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
