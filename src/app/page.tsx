"use client";

import { useState } from "react";
import Link from "next/link";

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
      <header className="border-b border-white/10 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">ASTRA MIND</h1>
          <p className="text-sm text-gray-400">Decision Memory Engine</p>
        </div>
        <nav className="flex gap-4">
          <Link href="/" className="text-white border-b-2 border-indigo-500 pb-1">Capture</Link>
          <Link href="/reviews" className="text-gray-400 hover:text-white transition-colors">Reviews</Link>
          <Link href="/profile" className="text-gray-400 hover:text-white transition-colors">Profile</Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto p-6 mt-8">
        {step === 1 && showDailyPrompt && (
          <div className="mb-8 bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5 animate-in fade-in slide-in-from-top-4 duration-500">
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
            <p className="text-xs text-gray-500 mt-3 text-right">
              Or use Full Mode below for complex reasoning ↓
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-medium text-white mb-2">Capture Deep Decision</h2>
              <p className="text-gray-400">What did you decide and why? Brain dump your reasoning.</p>
            </div>
            
            <textarea
              className="w-full h-64 bg-[#111] border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
              placeholder="I decided to..."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              disabled={isAnalyzing}
            />

            <div className="flex justify-end">
              <button
                onClick={() => handleAnalyze(rawInput)}
                disabled={isAnalyzing || !rawInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
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
              
              {Object.entries(structuredData).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    {key.replace("_", " ")}
                  </label>
                  <input
                    type="text"
                    className="bg-transparent border-b border-white/5 pb-1 focus:outline-none focus:border-indigo-500/50 text-gray-300 w-full"
                    value={Array.isArray(value) ? value.join(", ") : value}
                    onChange={(e) => {
                      setStructuredData({
                        ...structuredData,
                        [key]: Array.isArray(value) ? e.target.value.split(", ") : e.target.value
                      });
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Commit Gate */}
            <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-6 space-y-4">
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
                className="bg-red-600 hover:bg-red-700 disabled:opacity-20 disabled:cursor-not-allowed text-white px-8 py-3 rounded-md font-bold tracking-wide transition-all shadow-lg shadow-red-900/20"
              >
                {isCommitting ? "Committing..." : "Commit Decision to Memory"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
