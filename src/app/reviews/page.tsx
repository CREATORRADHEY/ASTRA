"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPendingReviews } from "./actions";

export default function PendingReviews() {
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [actualOutcome, setActualOutcome] = useState("");
  const [successRating, setSuccessRating] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ original_expectation: string; original_confidence: number; diagnosis: string } | null>(null);

  const [pendingReviews, setPendingReviews] = useState<Array<{id: string, date: string, context: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const data = await getPendingReviews();
      setPendingReviews(data);
      setIsLoading(false);
    };
    fetchReviews();
  }, []);

  const handleSubmitOutcome = async () => {
    if (!actualOutcome.trim()) return;
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

      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to process outcome.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EAEAEA] font-mono selection:bg-indigo-500/30">
      <header className="border-b border-white/10 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">ASTRA MIND</h1>
          <p className="text-sm text-gray-400">Decision Memory Engine</p>
        </div>
        <nav className="flex gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">Capture</Link>
          <Link href="/reviews" className="text-white border-b-2 border-indigo-500 pb-1">Reviews</Link>
          <Link href="/profile" className="text-gray-400 hover:text-white transition-colors">Profile</Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto p-6 mt-8">
        {/* Open Loop Reminder */}
        {!isLoading && pendingReviews.length > 0 && (
          <div className="mb-10 bg-blue-900/20 border border-blue-500/30 rounded-lg p-5 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-sm">💭</span>
              <h3 className="text-blue-400 font-medium text-sm uppercase tracking-wide">Open Loop Reflection</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              You recently decided: <span className="text-white italic">"{pendingReviews[0].context.substring(0, 100)}{pendingReviews[0].context.length > 100 ? '...' : ''}"</span>. Still confident?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedDecisionId(pendingReviews[0].id)}
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
              <div className="text-center text-gray-500 py-10">No pending reviews found. Log a decision first!</div>
            ) : (
              pendingReviews.map((review) => (
                <div 
                  key={review.id}
                  onClick={() => setSelectedDecisionId(review.id)}
                className="bg-[#111] border border-white/10 p-4 rounded-lg cursor-pointer hover:border-indigo-500/50 transition-colors group"
              >
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>ID: {review.id.substring(0, 8)}</span>
                  <span className="group-hover:text-indigo-400">{review.date}</span>
                </div>
                <p className="text-gray-200">{review.context}</p>
              </div>
            )))}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Forced Outcome Logging Form */}
            {!result ? (
              <div className="bg-[#111] border border-white/10 rounded-lg p-6 space-y-6">
                <div className="border-l-2 border-indigo-500/50 pl-4 py-1">
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Decision Context</p>
                  <p className="text-gray-200">
                    {pendingReviews.find(r => r.id === selectedDecisionId)?.context}
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-md border border-white/5 border-dashed">
                  <p className="text-center text-sm text-gray-500 italic">
                    🔒 Original expectation is hidden until outcome is submitted.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white">What actually happened?</label>
                  <textarea
                    className="w-full h-24 bg-[#0A0A0A] border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-indigo-500/50 resize-none text-sm placeholder:text-gray-600"
                    placeholder="The outcome was..."
                    value={actualOutcome}
                    onChange={(e) => setActualOutcome(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm text-white flex justify-between">
                    <span>Rate the Success of this decision</span>
                    <span className="text-indigo-400">{successRating}/100</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={successRating}
                    onChange={(e) => setSuccessRating(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Total Failure</span>
                    <span>Absolute Success</span>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    onClick={() => setSelectedDecisionId(null)}
                    className="text-gray-400 hover:text-white px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitOutcome}
                    disabled={!actualOutcome.trim() || isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    {isSubmitting ? "Running Delta Analysis..." : "Submit Outcome"}
                  </button>
                </div>
              </div>
            ) : (
              /* Delta Analysis Result */
              <div className="bg-[#111] border border-indigo-500/30 rounded-lg p-6 space-y-6">
                <h3 className="text-xl font-medium text-white border-b border-white/10 pb-2">Delta Analysis Complete</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-md border border-white/5">
                    <p className="text-xs text-gray-500 uppercase mb-1">Your Expectation</p>
                    <p className="text-gray-300 text-sm">{result.original_expectation}</p>
                    <p className="text-xs text-indigo-400 mt-2">Confidence: {result.original_confidence}%</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-md border border-white/5">
                    <p className="text-xs text-gray-500 uppercase mb-1">Actual Reality</p>
                    <p className="text-gray-300 text-sm">{actualOutcome}</p>
                    <p className="text-xs text-green-400 mt-2">Success: {successRating}%</p>
                  </div>
                </div>

                <div className="border border-red-500/20 bg-red-500/5 rounded-md p-4">
                  <p className="text-xs text-red-400 uppercase mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Active Diagnosis
                  </p>
                  <p className="text-gray-200">{result.diagnosis}</p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setResult(null);
                      setSelectedDecisionId(null);
                      setActualOutcome("");
                    }}
                    className="text-white hover:text-indigo-400 transition-colors"
                  >
                    Return to Pending Reviews →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Early Insight Engine (Hardcoded MVP Threshold met) */}
        <div className="mt-16 bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <h3 className="text-purple-400 font-medium text-sm uppercase tracking-wider">Early Insight Pattern Generated</h3>
          </div>
          <div className="bg-black/50 p-4 rounded-md border border-white/5 space-y-2">
            <p className="text-gray-200">
              <span className="text-purple-400 font-bold">Insight:</span> There is an early signal that you prioritize speed over technical debt. In 2 of your last 3 decisions, outcome quality dropped when you bypassed the Challenger prompt.
            </p>
            <p className="text-xs text-gray-500">
              Based on Decision ID #mock-1 and Decision ID #e9f2a4...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
