"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPendingReviews } from "@/app/reviews/actions";
import { trackEvent } from "@/utils/analytics";

type StructuredData = {
  context: string;
  chosen_option: string;
  discarded_options: string[];
  rationale: string;
  expected_outcome: string;
  confidence_level: number;
};

export default function AstraMindCapture() {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawInput, setRawInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [structuredData, setStructuredData] = useState<StructuredData | null>(null);
  const [challengerPrompt, setChallengerPrompt] = useState<string | null>(null);

  // Commit Gate State
  const [challengeResponse, setChallengeResponse] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [isOverriding, setIsOverriding] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Daily Prompt State
  const [showDailyPrompt, setShowDailyPrompt] = useState(true);
  const [quickInput, setQuickInput] = useState("");

  // Retention Loop
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  useEffect(() => {
    getPendingReviews().then(reviews => {
      setUnresolvedCount(reviews.length);
    });
  }, []);

  const handleAnalyze = async (inputToAnalyze: string = rawInput) => {
    if (!inputToAnalyze.trim()) return;
    setIsAnalyzing(true);
    setShowDailyPrompt(false);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: inputToAnalyze }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAnalysisId(data.analysis_id);
      setStructuredData(data.structured_data);
      setChallengerPrompt(data.challenger_prompt);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze decision. Ensure API keys are set.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      const res = await fetch("/api/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_id: analysisId,
          raw_input: rawInput,
          structured_data: structuredData,
          challenge_response: !isOverriding ? challengeResponse : null,
          override_reason: isOverriding ? overrideReason : null,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      await trackEvent('decision_created', { decision_id: data.decision_id || 'unknown' });

      alert("Decision Committed to Memory.");
      // Reset flow
      setStep(1);
      setRawInput("");
      setStructuredData(null);
      setChallengerPrompt(null);
      setChallengeResponse("");
      setOverrideReason("");
      setIsOverriding(false);
    } catch (err) {
      console.error(err);
      alert("Failed to commit decision.");
    } finally {
      setIsCommitting(false);
    }
  };

  const canCommit = isOverriding
    ? overrideReason.trim().length > 5
    : challengeResponse.trim().length > 10;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EAEAEA] font-mono selection:bg-indigo-500/30">
      <header className="border-b border-white/10 p-4 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            ASTRA MIND
          </h1>
          <p className="text-sm text-gray-400">Decision Memory Engine</p>
        </div>
        <nav className="flex gap-4">
          <Link href="/" className="text-white border-b-2 border-indigo-500 pb-1">Capture</Link>
          <Link href="/reviews" className="text-gray-400 hover:text-white transition-colors">Reviews</Link>
          <Link href="/profile" className="text-gray-400 hover:text-white transition-colors font-bold text-indigo-400">Score: {unresolvedCount > 0 ? 'Calibrating...' : 'Ready'}</Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto p-6 mt-8 space-y-12 pb-24">
        
        {/* FIX 1: Add Hero Section */}
        {step === 1 && !rawInput && !quickInput && (
          <section className="py-12 border-b border-white/5 animate-in fade-in zoom-in duration-700">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              You are worse at predicting <span className="text-indigo-400">outcomes</span> than you think.
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
              Astra Mind tracks your decisions and shows you exactly how wrong you were. Stop guessing. Start measuring.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-indigo-500 font-bold mb-2 block text-sm">STEP 1</span>
                <p className="text-sm text-gray-300">Log a real decision before the outcome occurs.</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-indigo-500 font-bold mb-2 block text-sm">STEP 2</span>
                <p className="text-sm text-gray-300">Wait for reality to happen. Be patient.</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-indigo-500 font-bold mb-2 block text-sm">STEP 3</span>
                <p className="text-sm text-gray-300">Get a brutal AI diagnosis of your biases.</p>
              </div>
            </div>

            <button 
              onClick={() => document.getElementById('capture-ui')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-md font-bold text-lg transition-all shadow-xl shadow-indigo-900/20"
            >
              Log Your First Decision ↓
            </button>
            
            {/* Social Proof */}
            <p className="mt-8 text-xs text-gray-500 italic">
              "Early users discovered they were wrong by 30–50% on average." — Astra Intelligence
            </p>
          </section>
        )}

        <div id="capture-ui" className="scroll-mt-24">
          {/* Retention Loop Banner */}
          {unresolvedCount > 0 && (
            <Link href="/reviews" className="block mb-8 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 hover:bg-orange-500/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-orange-400 text-xl">⚠️</span>
                  <div>
                    <h3 className="text-orange-400 font-medium">You have {unresolvedCount} unresolved decision{unresolvedCount !== 1 ? 's' : ''}</h3>
                    <p className="text-sm text-gray-400">Log outcomes to calibrate your Calibration Score.</p>
                  </div>
                </div>
                <span className="text-orange-400">→</span>
              </div>
            </Link>
          )}

          {/* FIX 2: First Action Guidance */}
          {step === 1 && (
            <div className="mb-8 p-4 bg-indigo-500/10 border-l-4 border-indigo-500 rounded-r-lg">
              <p className="text-sm text-indigo-300">
                <strong>Pro Tip:</strong> Start with one real decision you&apos;re making today. 
                <br />
                <span className="italic text-indigo-400/80">"Will I complete this project by Friday?"</span>
              </p>
            </div>
          )}

          {step === 1 && showDailyPrompt && (
            <div className="mb-12 bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <h2 className="text-indigo-400 font-medium tracking-wide text-sm uppercase">Daily Habit Engine</h2>
                </div>
                <div className="text-xs font-bold bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md border border-orange-500/30 flex items-center gap-1">
                  <span>🔥</span>
                  <span>3 Day Streak</span>
                </div>
              </div>
              <p className="text-white mb-4">What decision did you make today?</p>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-md px-4 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
                  placeholder="Quick Mode (1-line trivial decision)..."
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze(quickInput)}
                />
                <button 
                  onClick={() => handleAnalyze(quickInput)}
                  disabled={!quickInput.trim() || isAnalyzing}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm whitespace-nowrap"
                >
                  Quick Log
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-medium text-white mb-2">Capture Deep Decision</h2>
                {/* FIX 3: Empty State text */}
                <p className="text-gray-400">
                  {rawInput.length > 0 
                    ? "Explain your reasoning clearly. The AI will test your logic." 
                    : "No decisions yet. Log something you're about to do. The system only works if you start before the outcome."}
                </p>
              </div>
              
              <textarea
                className="w-full h-64 bg-[#111] border border-white/10 rounded-lg p-6 text-white focus:outline-none focus:border-indigo-500/50 resize-none transition-colors text-lg"
                placeholder="I decided to... because..."
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                disabled={isAnalyzing}
              />

              <div className="flex justify-end">
                <button
                  onClick={() => handleAnalyze(rawInput)}
                  disabled={isAnalyzing || !rawInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-md font-bold transition-all flex items-center gap-2 text-lg shadow-lg shadow-indigo-900/20"
                >
                  {isAnalyzing ? "Structuring Cognitive Model..." : "Analyze & Structure"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && structuredData && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* AI Trust Phase Warning */}
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200/80 px-4 py-2 rounded-md text-sm">
                ⚠️ AI-generated structure — please review and verify carefully.
              </div>

              {/* Structured Preview (Editable MVP) */}
              <div className="bg-[#111] border border-white/10 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-medium text-white border-b border-white/10 pb-2">Structured Cognitive Model</h3>
                
                {/* FIX 4: Improve Capture Page Clarity (Labels) */}
                {Object.entries(structuredData).map(([key, value]) => {
                  const labelMap: Record<string, string> = {
                    context: "Decision Context (What is happening?)",
                    chosen_option: "Chosen Action",
                    discarded_options: "Alternatives Considered",
                    rationale: "Reasoning / Logic",
                    expected_outcome: "Expected Outcome (What will happen?)",
                    confidence_level: "Confidence Level (0-100% — affects score)"
                  };
                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-xs text-indigo-400 uppercase font-bold tracking-wider">
                        {labelMap[key] || key.replace("_", " ")}
                      </label>
                      <input
                        type="text"
                        className="bg-transparent border-b border-white/10 pb-1 focus:outline-none focus:border-indigo-500/50 text-gray-300 w-full"
                        value={Array.isArray(value) ? value.join(", ") : value}
                        onChange={(e) => {
                          setStructuredData({
                            ...structuredData,
                            [key]: Array.isArray(value) ? e.target.value.split(", ") : e.target.value
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Commit Gate */}
              <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-6 space-y-4 shadow-2xl shadow-red-900/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Commit Gate Challenger
                  </h3>
                  <button 
                    onClick={() => setIsOverriding(!isOverriding)}
                    className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2"
                  >
                    {isOverriding ? "Respond to Challenge instead" : "Force Override"}
                  </button>
                </div>

                <p className="text-gray-200 text-lg border-l-2 border-red-500/50 pl-4 py-1 italic">
                  "{challengerPrompt}"
                </p>

                {!isOverriding ? (
                  <textarea
                    className="w-full h-24 bg-[#0A0A0A] border border-red-500/20 rounded-md p-3 text-white focus:outline-none focus:border-red-500/50 resize-none text-sm placeholder:text-gray-600"
                    placeholder="Defend your reasoning (min 10 chars)..."
                    value={challengeResponse}
                    onChange={(e) => setChallengeResponse(e.target.value)}
                  />
                ) : (
                  <textarea
                    className="w-full h-24 bg-[#0A0A0A] border border-yellow-500/20 rounded-md p-3 text-white focus:outline-none focus:border-yellow-500/50 resize-none text-sm placeholder:text-gray-600"
                    placeholder="Explain why you are bypassing this challenge..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-400 hover:text-white px-4 py-2 transition-colors"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleCommit}
                  disabled={!canCommit || isCommitting}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-20 disabled:cursor-not-allowed text-white px-8 py-3 rounded-md font-bold tracking-wide transition-all shadow-xl shadow-red-900/30 text-lg"
                >
                  {isCommitting ? "Committing..." : "Commit Decision to Memory"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FIX 10: Why This Exists Section */}
        {step === 1 && (
          <section className="mt-32 pt-20 border-t border-white/5 space-y-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Why Astra Mind exists</h2>
              <div className="space-y-6 text-gray-400 leading-relaxed text-lg">
                <p>
                  Most people never measure how accurate their thinking is. We remember being right, and we subconsciously ignore being wrong.
                </p>
                <p>
                  Astra fixes that by forcing you to commit to your reasoning <span className="text-white font-bold">before</span> the outcome happens. 
                </p>
                <p>
                  Your <span className="text-indigo-400 font-bold">Calibration Score</span> is the only metric that matters. It reflects your ability to see reality for what it is, not what you want it to be.
                </p>
              </div>
            </div>
            
            <div className="bg-indigo-500/5 border border-indigo-500/10 p-8 rounded-xl text-center">
              <h3 className="text-indigo-400 font-bold mb-2">Ready to test your thinking?</h3>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-white underline underline-offset-4 hover:text-indigo-300 transition-colors"
              >
                Log another decision →
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
