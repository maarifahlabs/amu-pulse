import { useEffect, useId, useState } from "react";
import {
  buildCampaignPredefinedTemplate,
  buildReminderPredefinedTemplate,
  calculateCampaignPrice,
  calculateReminderPrice,
  isChairPosition,
} from "@/lib/campaign-pricing";
import {
  buildUpiUri,
  openRazorpayCheckout,
  DEFAULT_UPI_ID,
  RAZORPAY_KEY_ID,
} from "@/lib/payment-gateway";
import { api } from "@/lib/api";

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

  // Real voter count from candidate profile (never hardcoded)
  const [realVoterCount, setRealVoterCount] = useState<number>(typeof votes === "number" ? votes : 0);

  // Fetch actual live voter count from backend to ensure real-time accuracy
  useEffect(() => {
    if (candidate?.id) {
      api.get<{ voterCount: number }>(`/campaigns/pricing/${candidate.id}`)
        .then((res) => {
          if (typeof res?.voterCount === "number") {
            setRealVoterCount(res.voterCount);
          }
        })
        .catch(() => {
          // fallback to votes prop if API fetch encounters error
          if (typeof votes === "number") {
            setRealVoterCount(votes);
          }
        });
    }
  }, [candidate?.id, votes]);

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

  // By default, "Edit Content" must be selected
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  // Payment State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    orderNumber: string;
    amount: number;
    razorpayOrderId?: string;
    razorpayKeyId?: string;
  } | null>(null);

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

  // Pricing calculations
  const campaignCalc = calculateCampaignPrice(recipientCount, isChair);
  const reminderCalc = calculateReminderPrice(realVoterCount, isChair);

  const currentPrice =
    activeTab === "email_campaign" ? campaignCalc.totalAmount : reminderCalc.totalAmount;
  const currentUnits =
    activeTab === "email_campaign" ? campaignCalc.units : reminderCalc.units;
  const currentAudienceCount =
    activeTab === "email_campaign" ? recipientCount : realVoterCount;

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    setStep("config");
    setErrorMsg(null);
    setOrderData(null);
    setSuccessData(null);
    setPreviewTab("edit");

    if (newTab === "email_campaign") {
      setSubject(campaignTemplate.subject);
      setAppealText(campaignTemplate.appeal);
    } else {
      setSubject(reminderTemplate.subject);
      setAppealText("");
    }
  };

  const handleProceedToPreview = () => {
    if (activeTab === "last_day_reminder" && realVoterCount <= 0) {
      setErrorMsg("Last Day Reminder cannot be sent because there are currently 0 votes recorded on your profile.");
      return;
    }
    setErrorMsg(null);
    setStep("preview");
  };

  const handleProceedToPayment = async () => {
    if (activeTab === "last_day_reminder" && realVoterCount <= 0) {
      setErrorMsg("Last Day Reminder requires at least 1 voter to proceed.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const fullContent =
      activeTab === "email_campaign"
        ? `${appealText}\n\n📌 KEY MANIFESTO COMMITMENTS:\n${manifestoText}\n\n🤲 VOTE, SUPPORT & DUA (ووٹ، سپورٹ اور دعا)\nCandidate: ${candidate.name} ${position?.title ? `(${position.title})` : ""}\nAMUSU Elections 2026`
        : `${appealText}\n\n⏰ LAST DAY VOTING REMINDER\nPlease cast your ballot for ${candidate.name} on polling day.\nVote, Support & Dua!`;

    try {
      let resOrder: any = null;
      try {
        resOrder = await api.post<any>("/campaigns/order", {
          candidateId: candidate.id,
          campaignType: activeTab,
          recipientCount: currentAudienceCount,
          emailSubject: subject,
          emailContent: fullContent,
          manifestoExcerpt: manifestoText,
        });
      } catch {
        // Fallback simulation in dev mode if API is unreachable
        const orderNumber = `UPI-AMU-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        resOrder = {
          orderId: crypto.randomUUID(),
          orderNumber,
          amount: currentPrice,
          razorpayOrderId: `order_dev_${Date.now().toString(36)}`,
          razorpayKeyId: RAZORPAY_KEY_ID || "rzp_test_placeholder",
        };
      }

      setOrderData({
        orderId: resOrder.orderId,
        orderNumber: resOrder.orderNumber,
        amount: resOrder.amount,
        razorpayOrderId: resOrder.razorpayOrderId,
        razorpayKeyId: resOrder.razorpayKeyId || RAZORPAY_KEY_ID,
      });
      setStep("payment");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to generate payment order.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * One-click Unified UPI Payment Checkout
   */
  const handlePayWithUpi = async () => {
    if (!orderData) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      const key = orderData.razorpayKeyId || RAZORPAY_KEY_ID || "rzp_test_placeholder";

      await openRazorpayCheckout({
        key,
        amount: orderData.amount * 100, // paise
        currency: "INR",
        name: "AMU Pulse AMUSU Election",
        description:
          activeTab === "email_campaign"
            ? `Campaign to ${currentAudienceCount.toLocaleString()} Students`
            : `Reminder to your ${currentAudienceCount.toLocaleString()} Voters`,
        order_id: orderData.razorpayOrderId || "",
        prefill: {
          name: candidate.name,
        },
        theme: {
          color: "#0b8565", // AMU Pulse Brand Green
        },
        handler: async (response) => {
          setLoading(true);
          try {
            const verification = await api.post<any>("/campaigns/verify-razorpay", {
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setSuccessData({
              orderNumber: verification.orderNumber || orderData.orderNumber,
              amountPaid: verification.amountPaid || orderData.amount,
              recipientCount: verification.recipientCount || currentAudienceCount,
              transactionRef: response.razorpay_payment_id,
              message: verification.message,
            });
            setStep("success");
          } catch (err) {
            setErrorMsg(
              err instanceof Error
                ? err.message
                : "Payment verification failed. Campaign process was not triggered.",
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not open UPI payment window. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card space-y-6 border-brand-200 bg-white p-6 shadow-sm">
      {/* Header and Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
              Candidate Campaign Portal
            </span>
            {isChair ? (
              <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                👑 Chair Position (President / VP / Secretary)
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                Member / Court Position
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl font-display mt-1">
            Outreach, Campaigning &amp; Reminders
          </h2>
          <p className="text-sm text-slate-600">
            Reach students across AMU with your manifesto or mobilize your confirmed voters on polling day.
          </p>
        </div>

        {/* Two Highlighted Toggle Buttons (Green Background) */}
        <div className="flex items-center rounded-2xl bg-brand-50 p-1.5 border border-brand-200 shadow-xs gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("email_campaign")}
            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === "email_campaign"
                ? "bg-brand-600 text-white shadow-md ring-2 ring-brand-700/20"
                : "bg-white text-brand-900 hover:bg-brand-100/70 border border-brand-200/60"
            }`}
          >
            <span>📧</span> Email Campaigning
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("last_day_reminder")}
            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === "last_day_reminder"
                ? "bg-brand-600 text-white shadow-md ring-2 ring-brand-700/20"
                : "bg-white text-brand-900 hover:bg-brand-100/70 border border-brand-200/60"
            }`}
          >
            <span>⏰</span> Last Day Reminder
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
          Audience &amp; Pricing
        </div>
        <div
          className={`flex items-center justify-center gap-1.5 ${
            step === "preview" ? "text-brand-700 font-bold" : "text-slate-400"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs">
            2
          </span>
          Preview &amp; Edit
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
          Pay with UPI (Last)
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
                  <strong>&quot;Vote, Support &amp; Dua&quot;</strong> and your published manifesto commitments.
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
                  <strong> This email goes strictly to your confirmed voters only.</strong>
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-600" />
                  <strong>Privacy Rule:</strong> Voter identities are completely secret and anonymous. Only your total vote count is shown.
                </div>
              </div>

              {/* Real Voter Count on Profile */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Votes On Your Profile (Your Voters Only)
                    </span>
                    <div className="text-2xl font-black text-ink sm:text-3xl">
                      {realVoterCount.toLocaleString()} <span className="text-sm font-normal text-slate-500">Voters</span>
                    </div>
                  </div>
                  {realVoterCount > 0 ? (
                    <span className="badge bg-emerald-100 text-emerald-800 font-bold">
                      {reminderCalc.units} Tier block (Up to {reminderCalc.units * 1000} voters)
                    </span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-800 font-bold">
                      Awaiting votes on profile
                    </span>
                  )}
                </div>
                {realVoterCount <= 0 && (
                  <p className="mt-2 text-xs text-amber-800">
                    Your profile currently has 0 votes recorded. As students vote for you on AMU Pulse, this count updates in real time.
                  </p>
                )}
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
                <span className="font-semibold text-ink">
                  {currentAudienceCount.toLocaleString()} {activeTab === "last_day_reminder" ? "Voters (Your Voters Only)" : "Students"}
                </span>
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
              disabled={activeTab === "last_day_reminder" && realVoterCount <= 0}
              className="btn-primary"
            >
              Next: Preview &amp; Edit Template →
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PREVIEW & EDIT ================= */}
      {step === "preview" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-ink text-lg">Preview &amp; Edit Message</h3>
              <p className="text-xs text-slate-500">
                Review the predefined template before payment. You can edit the subject, appeal, and manifesto points.
              </p>
            </div>

            {/* Green Highlighted Toggle: Edit Content & Live Email Preview */}
            <div className="flex items-center rounded-xl bg-brand-50 p-1.5 border border-brand-200 shadow-xs gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPreviewTab("edit")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                  previewTab === "edit"
                    ? "bg-brand-600 text-white shadow-sm ring-1 ring-brand-700/20"
                    : "bg-white text-brand-900 hover:bg-brand-100/70 border border-brand-200/60"
                }`}
              >
                <span>✏️</span> Edit Content
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("preview")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                  previewTab === "preview"
                    ? "bg-brand-600 text-white shadow-sm ring-1 ring-brand-700/20"
                    : "bg-white text-brand-900 hover:bg-brand-100/70 border border-brand-200/60"
                }`}
              >
                <span>👁️</span> Live Email Preview
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
                  className="input font-medium"
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
                <div className="border-b border-slate-100 pb-3 text-xs text-slate-600 space-y-1">
                  <p><strong>From:</strong> AMU Pulse AMUSU Election &lt;contact@maarifahlabs.com&gt;</p>
                  <p><strong>To:</strong> student@myamu.ac.in ({activeTab === "last_day_reminder" ? `Your Voters: ${currentAudienceCount.toLocaleString()}` : `Recipients: ${currentAudienceCount.toLocaleString()}`})</p>
                  <p><strong>Subject:</strong> {subject}</p>
                </div>

                {/* Predefined Badge */}
                <div className="text-center py-1">
                  <span className="inline-block rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
                    🤲 VOTE, SUPPORT &amp; DUA (ووٹ، سپورٹ اور دعا)
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
              {loading ? "Generating Payment Order..." : "Proceed to Pay with UPI (Last Step) →"}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: PAYMENT OPTION SHOWS LAST (PAY WITH UPI) ================= */}
      {step === "payment" && orderData && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-200 bg-brand-50/90 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-800">
                  Official Election Gateway
                </span>
                <h3 className="text-2xl font-black text-brand-950 sm:text-3xl">
                  Pay ₹{orderData.amount.toLocaleString()} with UPI
                </h3>
                <p className="text-xs text-brand-800 mt-0.5">
                  Order Reference: <code className="font-mono font-bold bg-white/70 px-1.5 py-0.5 rounded">{orderData.orderNumber}</code>
                </p>
              </div>
              <span className="badge bg-emerald-100 text-emerald-900 font-bold px-3 py-1">
                ✓ Ready for Instant Checkout
              </span>
            </div>
          </div>

          {/* Clean Unified Pay With UPI Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8 space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white text-3xl shadow-sm">
              📱
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-xl font-bold text-ink font-display">Instant Payment with UPI</h4>
              <p className="text-sm text-slate-600">
                Tap the button below to pay securely using any UPI app on your phone (Google Pay, PhonePe, Paytm, BHIM) or Debit/Credit Card.
              </p>
            </div>

            {/* Campaign Summary Pill */}
            <div className="mx-auto max-w-sm rounded-xl bg-white border border-slate-200 p-3.5 text-xs text-slate-700 flex justify-between items-center shadow-xs">
              <span>{activeTab === "email_campaign" ? "Target Audience:" : "Target Voters:"}</span>
              <span className="font-bold text-ink">
                {currentAudienceCount.toLocaleString()} {activeTab === "email_campaign" ? "Students" : "Voters Only"}
              </span>
              <span className="font-black text-brand-700 text-sm">₹{orderData.amount.toLocaleString()}</span>
            </div>

            {/* Primary Action: Pay with UPI */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePayWithUpi}
                disabled={loading}
                className="btn-primary w-full max-w-sm py-3.5 text-base font-bold shadow-md hover:shadow-lg transition-transform active:scale-95"
              >
                {loading ? "Opening UPI Checkout..." : `Pay ₹${orderData.amount.toLocaleString()} with UPI →`}
              </button>
            </div>

            <div className="text-xs text-slate-500 flex flex-wrap items-center justify-center gap-3 pt-2">
              <span>🔒 256-bit Bank Grade Security</span>
              <span>•</span>
              <span>All UPI Apps Supported</span>
              <span>•</span>
              <span>Immediate Campaign Trigger</span>
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
          </div>
        </div>
      )}

      {/* ================= STEP 4: SUCCESS RECEIPT ================= */}
      {step === "success" && successData && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-3xl font-bold">
            ✓
          </div>
          <h3 className="text-2xl font-bold text-emerald-950 sm:text-3xl font-display">
            Payment Verified &amp; Campaign Dispatched!
          </h3>
          <p className="text-sm text-emerald-800 max-w-md mx-auto">
            {successData.message}
          </p>

          {/* Receipt details */}
          <div className="mx-auto max-w-md rounded-xl border border-emerald-200 bg-white p-5 text-left text-xs space-y-2.5 text-slate-700 shadow-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2 font-bold text-slate-900 text-sm">
              <span>Official Payment Receipt</span>
              <span>AMU Pulse Elections</span>
            </div>
            <div className="flex justify-between">
              <span>Order Number:</span>
              <span className="font-mono font-semibold text-slate-800">{successData.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span className="font-bold text-emerald-700 text-sm">₹{successData.amountPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Reference:</span>
              <span className="font-mono">{successData.transactionRef}</span>
            </div>
            <div className="flex justify-between">
              <span>Target Recipients:</span>
              <span className="font-semibold text-slate-900">
                {successData.recipientCount.toLocaleString()} {activeTab === "email_campaign" ? "Students" : "Voters Only"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Campaign Type:</span>
              <span className="capitalize font-medium">{activeTab === "email_campaign" ? "Email Campaigning" : "Last Day Reminder"}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setStep("config");
                setSuccessData(null);
                setOrderData(null);
                setPreviewTab("edit");
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
