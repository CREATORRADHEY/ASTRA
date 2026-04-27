import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { decision_id, actual_outcome, success_rating } = await req.json();

    if (!decision_id || !actual_outcome || success_rating == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch original decision
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .select('user_id, structured_data, status')
      .eq('id', decision_id)
      .single();

    if (decisionError || !decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    if (decision.status === 'resolved') {
      return NextResponse.json({ error: 'Outcome already logged for this decision.' }, { status: 403 });
    }

    // Structured data might be inside an array or an object
    const structuredData = decision.structured_data?.[0] || decision.structured_data || {};
    const context = structuredData.context || "No context";
    const expected_outcome = structuredData.expected_outcome || "No expectation";
    const confidence = structuredData.confidence_level || 50;

    // Fix 1: Fetch last 2 AI diagnoses for this user to prevent repetition
    const { data: recentDecisions } = await supabase
      .from('decisions')
      .select('ai_diagnosis')
      .eq('user_id', decision.user_id)
      .eq('status', 'resolved')
      .not('ai_diagnosis', 'is', null)
      .order('created_at', { ascending: false })
      .limit(2);

    const previousDiagnoses = (recentDecisions || [])
      .map((d: any) => d.ai_diagnosis?.verdict || '')
      .filter(Boolean);

    const previousContext = previousDiagnoses.length > 0
      ? `\nPREVIOUS DIAGNOSES (do NOT repeat these reasoning patterns — find a different angle):\n${previousDiagnoses.map((v: string, i: number) => `${i + 1}. ${v}`).join('\n')}`
      : '';

    // 2. Run Delta Analysis (Gemini 2.5 Flash)
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        mistake: z.string(),
        bias: z.string(),
        missed_factor: z.string(),
        verdict: z.string()
      }),
      prompt: `You are a brutally honest cognitive analyst.

Your job is to evaluate how wrong the user was.

INPUT:
- Decision Context: ${context}
- Expected Outcome: ${expected_outcome}
- Confidence (0-100): ${confidence}
- Actual Outcome: ${actual_outcome}
- Success Rating (0-100): ${success_rating}
${previousContext}

OUTPUT FORMAT (STRICT JSON):
{
  "mistake": "What exactly did the user get wrong?",
  "bias": "Which cognitive bias is visible?",
  "missed_factor": "What specific factor or variable did the user ignore?",
  "verdict": "One brutal sentence summarizing failure or accuracy"
}

RULES:
- Be specific to this exact scenario — reference exact words from the input
- Do NOT repeat the same type of reasoning across responses
- If a similar bias appears again, explain it from a different angle with new evidence from the input
- Do NOT give generic advice
- No motivational tone
- No fluff
- Call out flawed assumptions, missing variables, or poor reasoning`
    });

    // Fix 3: Clamp score impact to max 10 points per decision (prevents rage quit)
    const MAX_CHANGE = 10;
    const delta = Math.abs(confidence - success_rating);
    let raw_change = -(delta * 0.2);
    if (delta < 10) raw_change += 2;
    const score_change = raw_change > 0
      ? Math.min(raw_change, MAX_CHANGE)
      : Math.max(raw_change, -MAX_CHANGE);

    // 4. Update Database
    // A. Update the decision
    await supabase.from('decisions').update({
      actual_outcome,
      success_rating,
      status: 'resolved',
      ai_diagnosis: object
    }).eq('id', decision_id);

    // B. Fetch and Update User Score
    const { data: userRecord } = await supabase
      .from('users')
      .select('calibration_score, total_decisions')
      .eq('id', decision.user_id)
      .single();

    if (userRecord) {
      let new_score = (userRecord.calibration_score || 50) + score_change;
      new_score = Math.max(0, Math.min(100, new_score));

      await supabase.from('users').update({
        calibration_score: Math.round(new_score),
        total_decisions: (userRecord.total_decisions || 0) + 1
      }).eq('id', decision.user_id);
    }

    // 5. Return Results to Client — include delta for "why score changed" explanation
    return NextResponse.json({
      original_expectation: expected_outcome,
      original_confidence: confidence,
      diagnosis: object,
      score_change: Math.round(score_change),
      delta: Math.round(delta),  // Fix 6: expose raw delta so UI can show "You were X% off"
      new_total_decisions: (userRecord?.total_decisions || 0) + 1
    });

  } catch (error) {
    console.error('API Outcome Error:', error);
    return NextResponse.json({ error: 'Failed to process outcome' }, { status: 500 });
  }
}
