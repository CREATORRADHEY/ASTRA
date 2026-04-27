"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPendingReviews } from "./actions";
import { trackEvent } from "@/utils/analytics";
import { createClient } from "@/utils/supabase/client";

type Diagnosis = {
  mistake: string;
  bias: string;
  missed_factor: string;
  verdict: string;
};

type Result = {
  decision_id: string;
  original_expectation: string;
  original_confidence: number;
  diagnosis: Diagnosis;
  score_change: number;
  delta: number;  // raw gap between confidence and success
  new_total_decisions: number;
};

export default function PendingReviews() {
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [actualOutcome, setActualOutcome] = useState("");
  const [successRating, setSuccessRating] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const [pendingReviews, setPendingReviews] = useState<Array<{id: string, date: string, context: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Feature 2: AI Trust Signal
  const [aiFeedback, setAiFeedback] = useState<"agree" | "disagree" | null>(null);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  // Feature 3: Emotional Impact
  const [emotionalResponse, setEmotionalResponse] = useState<"neutral" | "uncomfortable" | "brutal" | null>(null);
  const [emotionSaved, setEmotionSaved] = useState(false);

  // Feature 4: Retention Modal
  const [showRetentionModal, setShowRetentionModal] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      const data = await getPendingReviews();
      setPendingReviews(data);
      setIsLoading(false);
    };
    fetchReviews();
  }, []);

  // Track when user opens a specific review
  const handleSelectDecision = (id: string) => {
    setSelectedDecisionId(id);
    trackEvent("review_started", { decision_id: id });
  };

  const handleSubmitOutcome = async () => {
    if (actualOutcome.trim().length < 20) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision_id: selectedDecisionId,
          actual_outcome: actualOutcome,
          success_rating: successRating,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Feature 1: Track key events
      await trackEvent("review_submitted", { decision_id: selectedDecisionId! });
      await trackEvent("ai_verdict_shown", { decision_id: selectedDecisionId! });

      setResult({ ...data, decision_id: selectedDecisionId! });

      // Remove the resolved review from the list
      setPendingReviews(prev => prev.filter(r => r.id !== selectedDecisionId));

      // Fix 4: Trigger modal on scroll OR after 7s — whichever comes first
      let modalShown = false;
      const showModal = () => {
        if (!modalShown) {
          modalShown = true;
          setShowRetentionModal(true);
          window.removeEventListener('scroll', showModal);
        }
      };
      window.addEventListener('scroll', showModal, { once: true });
      setTimeout(showModal, 7000);
    } catch (err) {
      console.error(err);
      alert("Failed to process outcome.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiFeedback = async (feedback: "agree" | "disagree") => {
    if (feedbackSaved || !result) return;
    setAiFeedback(feedback);
    setFeedbackSaved(true);

    await trackEvent("ai_feedback_given", { decision_id: result.decision_id, feedback });

    const supabase = createClient();
    await supabase
      .from("decisions")
      .update({ ai_feedback: feedback })
      .eq("id", result.decision_id);
  };

  const handleEmotionalResponse = async (emotion: "neutral" | "uncomfortable" | "brutal") => {
    if (emotionSaved || !result) return;
    setEmotionalResponse(emotion);
    setEmotionSaved(true);

    await trackEvent("emotional_response_given", { decision_id: result.decision_id, emotion });

    const supabase = createClient();
    await supabase
      .from("decisions")
      .update({ emotional_response: emotion })
      .eq("id", result.decision_id);
  };

  const handleCTAClick = () => {
    trackEvent("cta_clicked", { source: "retention_modal" });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EAEAEA] font-mono selection:bg-indigo-500/30"      <header className="border-b border-white/10 p-4 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            ASTRA MIND
          </h1>
          <p className="text-sm text-gray-400">Decision Memory Engine</p>
        </div>
        <nav className="flex gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">Capture</Link>
          <Link href="/reviews" className="text-white border-b-2 border-indigo-500 pb-1">Reviews</Link>
          <Link href="/profile" className="text-gray-400 hover:text-white transition-colors">Profile</Link>
        </nav>
      </header>

      {/* Feature 4: Retention Modal */}
      {showRetentionModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#111] border border-indigo-500/40 rounded-xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-2">
              <p className="text-xs text-indigo-400 uppercase tracking-wider font-bold">Momentum Window</p>
              <h3 className="text-xl font-bold text-white">You&apos;ll forget this insight if you don&apos;t act now.</h3>
              <p className="text-sm text-gray-400">
                Your calibration score shifted by{" "}
                <span className={result && result.score_change > 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {result && result.score_change > 0 ? "+" : ""}{result?.score_change}
                </span>
                .
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCTAClick}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-md font-bold transition-all shadow-lg shadow-indigo-900/30"
              >
                {/* FIX 9: Improve CTA Text */}
                Log another decision before you forget this insight
              </button>
              <button
                onClick={() => setShowRetentionModal(false)}
                className="w-full text-gray-500 hover:text-gray-300 py-2 text-sm transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto p-6 mt-8 space-y-12 pb-24">
        {/* FIX 5: Review Page Top Warning */}
        {selectedDecisionId && !result && (
          <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg animate-in slide-in-from-top-2 duration-500">
            <p className="text-sm text-red-400 font-bold uppercase tracking-tight">⚠️ Serious Data Input Required</p>
            <p className="text-sm text-gray-300 mt-1">
              This is where your thinking gets tested. Be honest — inaccurate inputs will break your Calibration Score.
            </p>
          </div>
        )}

        {/* Open Loop Reminder */}
        {!isLoading && pendingReviews.length > 0 && !selectedDecisionId && (
          <div className="mb-10 bg-blue-900/20 border border-blue-500/30 rounded-lg p-5 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-sm">💭</span>
              <h3 className="text-blue-400 font-medium text-sm uppercase tracking-wide">Open Loop Reflection</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              You recently decided: <span className="text-white italic">&quot;{pendingReviews[0].context.substring(0, 100)}{pendingReviews[0].context.length > 100 ? '...' : ''}&quot;</span>. Still confident?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleSelectDecision(pendingReviews[0].id)}
                className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-4 py-1.5 rounded-md text-xs transition-colors border border-blue-500/30 font-medium"
              >
                Log Outcome Now
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-medium text-white mb-2">Pending Reviews</h2>
            <p className="text-gray-400">Log actual outcomes to calibrate your judgment.</p>
          </div>
          <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-sm border border-red-500/20 animate-pulse font-medium">
            {pendingReviews.length} Due
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : !selectedDecisionId ? (
          <div className="grid gap-4">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <p className="text-gray-500">No pending reviews. Log a decision first!</p>
                <Link href="/" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md">Capture Decision</Link>
              </div>
            ) : (
              pendingReviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => handleSelectDecision(review.id)}
                  className="bg-[#111] border border-white/10 p-6 rounded-lg cursor-pointer hover:border-indigo-500/50 transition-all hover:bg-white/[0.02] group"
                >
                  <div className="flex justify-between text-xs text-gray-500 mb-3 uppercase tracking-widest font-bold">
                    <span>ID: {review.id.substring(0, 8)}</span>
                    <span className="group-hover:text-indigo-400">{review.date}</span>
                  </div>
                  <p className="text-gray-200 text-lg leading-relaxed">{review.context}</p>
                </div>
              ))
            )}
            
            {/* FIX 8: Social Proof */}
            <div className="mt-12 text-center py-8 border-t border-white/5">
              <p className="text-sm text-gray-500 italic">
                &quot;Most users discover their confidence was 40% higher than their actual success rate.&quot;
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!result ? (
              /* Outcome Submission Form */
              <div className="bg-[#111] border border-white/10 rounded-lg p-8 space-y-8 shadow-2xl">
                <div className="border-l-4 border-indigo-500/50 pl-6 py-1">
                  <p className="text-xs text-indigo-400 uppercase tracking-widest font-bold mb-2">Decision Context</p>
                  <p className="text-gray-200 text-xl leading-relaxed">
                    {pendingReviews.find(r => r.id === selectedDecisionId)?.context}
                  </p>
                </div>

                <div className="bg-black/50 p-6 rounded-md border border-white/5 border-dashed">
                  <p className="text-center text-sm text-gray-500 italic">
                    🔒 Original expectation and confidence are hidden until you submit the outcome. 
                    <br />This prevents hindsight bias from affecting your input.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-white font-bold uppercase tracking-wide">What actually happened?</label>
                  <textarea
                    className="w-full h-32 bg-[#0A0A0A] border border-white/10 rounded-md p-4 text-white focus:outline-none focus:border-indigo-500/50 resize-none text-lg placeholder:text-gray-700 transition-all"
                    placeholder={"Describe the final outcome in detail...\nWhere were you wrong?\nWhat did you miss?"}
                    value={actualOutcome}
                    onChange={(e) => setActualOutcome(e.target.value)}
                  />
                  {actualOutcome.trim().length > 0 && actualOutcome.trim().length < 20 && (
                    <p className="text-xs text-orange-400 mt-1">Please provide at least 20 characters of detail for a quality calibration.</p>
                  )}
                </div>

                <div className="space-y-6">
                  <label className="text-sm text-white flex justify-between font-bold uppercase tracking-wide">
                    <span>Rate the actual success of this decision</span>
                    <span className="text-indigo-400 text-xl">{successRating}/100</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={successRating}
                    onChange={(e) => setSuccessRating(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-tighter">
                    <span>0 = Complete failure</span>
                    <span>50 = Mixed outcome</span>
                    <span>100 = Perfect outcome</span>
                  </div>
                </div>

                <div className="flex justify-end gap-6 pt-6">
                  <button
                    onClick={() => setSelectedDecisionId(null)}
                    className="text-gray-500 hover:text-white px-4 py-2 transition-colors font-bold uppercase text-xs tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitOutcome}
                    disabled={actualOutcome.trim().length < 20 || isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-md font-bold transition-all shadow-lg shadow-indigo-900/30"
                  >
                    {isSubmitting ? "Running Delta Analysis..." : "Submit Outcome →"}
                  </button>
                </div>
              </div>
            ) : (
              /* Delta Analysis Result */
              <div className="bg-[#111] border border-indigo-500/30 rounded-lg p-8 space-y-10 animate-in fade-in duration-500 shadow-2xl">
                <div className="flex justify-between items-start border-b border-white/10 pb-6">
                  <div>
                    {/* FIX 6: Upgrade AI Verdict Section Title */}
                    <h3 className="text-2xl font-bold text-white">🧠 Your Cognitive Diagnosis</h3>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                      This is how your expectation differed from reality. 
                      You were{' '}
                      <span className={result.delta <= 10 ? 'text-green-400 font-bold' : 'text-orange-400 font-bold'}>
                        {result.delta}% off
                      </span>
                      {' '}your prediction.
                    </p>
                  </div>
                  <div className={`px-5 py-2 rounded-lg text-sm font-bold flex flex-col items-center ${result.score_change > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    <span className="text-2xl">{result.score_change > 0 ? '+' : ''}{result.score_change}</span>
                    <span className="text-[10px] uppercase tracking-tighter">Calibration</span>
                  </div>
                </div>

                {/* FIX 7: Score Explanation */}
                <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-md text-xs text-indigo-300 leading-relaxed italic">
                  <strong>Note:</strong> Your Calibration Score reflects how accurately you predict outcomes. 
                  Smaller deltas between your confidence and actual success lead to higher scores.
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-black/40 p-5 rounded-lg border border-white/5 space-y-3">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Your Expectation</p>
                    <p className="text-gray-200 text-lg italic leading-relaxed">&quot;{result.original_expectation}&quot;</p>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${result.original_confidence}%` }} />
                      </div>
                      <span className="text-xs text-indigo-400 font-bold">{result.original_confidence}% Confident</span>
                    </div>
                  </div>
                  <div className="bg-black/40 p-5 rounded-lg border border-white/5 space-y-3">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Actual Reality</p>
                    <p className="text-gray-200 text-lg leading-relaxed">{actualOutcome}</p>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${successRating}%` }} />
                      </div>
                      <span className="text-xs text-green-400 font-bold">{successRating}% Success</span>
                    </div>
                  </div>
                </div>

                {/* AI Diagnosis Block */}
                <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-6 space-y-6">
                  <p className="text-xs text-red-400 uppercase font-bold flex items-center gap-2 tracking-[0.2em]">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Brutal AI Verdict
                  </p>

                  <div className="grid gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Primary Mistake</p>
                      <p className="text-gray-200 text-lg">{result.diagnosis.mistake}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Detected Bias</p>
                        <p className="text-orange-300 font-medium">{result.diagnosis.bias}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Missed Factor</p>
                        <p className="text-yellow-300 font-medium">{result.diagnosis.missed_factor}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-red-500/10">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2 tracking-widest">Bottom Line</p>
                      <p className="text-red-300 text-xl font-bold italic leading-relaxed">&quot;{result.diagnosis.verdict}&quot;</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-white/5">
                  <button
                    onClick={() => {
                      setResult(null);
                      setSelectedDecisionId(null);
                      setActualOutcome("");
                      setAiFeedback(null);
                      setFeedbackSaved(false);
                      setEmotionalResponse(null);
                      setEmotionSaved(false);
                    }}
                    className="text-gray-500 hover:text-indigo-400 transition-colors text-sm font-bold uppercase tracking-widest"
                  >
                    ← Back to Reviews
                  </button>
                  
                  {/* FIX 9: Implicit CTA push */}
                  <Link 
                    href="/" 
                    className="bg-white text-black px-6 py-2 rounded-md font-bold text-sm hover:bg-gray-200 transition-all"
                  >
                    Log Another Decision
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>v>
        )}
      </main>
    </div>
  );
}
