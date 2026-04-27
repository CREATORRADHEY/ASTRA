import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { decision_id, actual_outcome, success_rating } = await req.json();

    if (!decision_id || !actual_outcome || success_rating == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Backend Guard: Validate outcome not yet submitted
    /* 
    const { data: existingOutcome } = await supabase
      .from('outcomes')
      .select('id')
      .eq('decision_id', decision_id)
      .single();

    if (existingOutcome) {
      return NextResponse.json({ error: 'Outcome already logged for this decision.' }, { status: 403 });
    }
    */

    // 2. Insert Outcome (simulated for MVP)
    /*
    await supabase.from('outcomes').insert({
      decision_id,
      actual_outcome,
      success_rating,
    });

    // Update decision status
    await supabase.from('decisions').update({ status: 'resolved' }).eq('id', decision_id);
    */

    // 3. Fetch original expectation
    /*
    const { data: structuredData } = await supabase
      .from('structured_data')
      .select('*')
      .eq('decision_id', decision_id)
      .single();
    */
   
    // MOCK DATA for MVP UI since DB is likely empty right now
    const mockOriginalData = {
      rationale: "I believed launching fast would capture the early market.",
      expected_outcome: "We would get 500 signups in week one.",
      confidence_level: 85,
    };

    // 4. Run Delta Analysis (Active Diagnosis)
    const { object } = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema: z.object({
        diagnosis: z.string().describe('Actionable, slightly uncomfortable behavioral diagnosis comparing expectation to reality. E.g. "You overestimate X"'),
      }),
      prompt: `Analyze this decision outcome:
      Original Expectation: ${mockOriginalData.expected_outcome}
      Original Rationale: ${mockOriginalData.rationale}
      Original Confidence: ${mockOriginalData.confidence_level}%
      
      Actual Outcome: ${actual_outcome}
      User's Success Rating: ${success_rating}%

      Task: Provide an active diagnosis of their reasoning vs reality. 
      CRITICAL RULE: You must use "Confidence Framing". Do not be brutally harsh (e.g. "You overestimate timelines"). Instead, soften the resistance (e.g. "There's an early signal you may be optimistic about timelines"). Deliver the truth, but frame it so the user's ego does not reject it. Max 2 sentences.`
    });

    // 5. Reveal Original Expectation & New Diagnosis
    return NextResponse.json({
      original_expectation: mockOriginalData.expected_outcome,
      original_confidence: mockOriginalData.confidence_level,
      diagnosis: object.diagnosis
    });

  } catch (error) {
    console.error('API Outcome Error:', error);
    return NextResponse.json({ error: 'Failed to process outcome' }, { status: 500 });
  }
}
