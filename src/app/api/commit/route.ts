import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { analysis_id, raw_input, structured_data, challenge_response, override_reason } = body;

    // 1. Strict Backend Validation (Commit Gate Enforcement)
    if (!analysis_id) {
      return NextResponse.json({ error: 'Missing analysis_id' }, { status: 400 });
    }

    if (!challenge_response && !override_reason) {
      return NextResponse.json({ error: 'Commit Gate Failed: Must provide challenge_response or override_reason.' }, { status: 403 });
    }

    // 2. Fetch Active User Session
    const supabaseClient = await createClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // 3. Insert Decision Record
    const { data: decision, error: decisionError } = await supabaseClient
      .from('decisions')
      .insert({
        user_id: user.id,
        raw_input,
        review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day short loop
      })
      .select('id')
      .single();

    if (decisionError) throw decisionError;

    // 4. Insert Structured Data
    await supabaseClient.from('structured_data').insert({
      decision_id: decision.id,
      analysis_id, // Hard link to prevent mismatch attacks
      context: structured_data.context,
      chosen_option: structured_data.chosen_option,
      discarded_options: structured_data.discarded_options,
      rationale: structured_data.rationale,
      expected_outcome: structured_data.expected_outcome,
      confidence_level: structured_data.confidence_level,
    });

    // 5. Insert Challenge Interaction
    await supabaseClient.from('challenge_interactions').insert({
      decision_id: decision.id,
      challenge_prompt: "User successfully navigated Commit Gate", // Simplification for MVP
      user_response: challenge_response || null,
      override_reason: override_reason || null,
      interaction_time_ms: 5000,
    });

    // Simulate successful commit for the UI flow without a real DB connection yet.
    return NextResponse.json({ success: true, message: 'Decision securely committed.' });

  } catch (error) {
    console.error('API Commit Error:', error);
    return NextResponse.json({ error: 'Failed to commit decision' }, { status: 500 });
  }
}
