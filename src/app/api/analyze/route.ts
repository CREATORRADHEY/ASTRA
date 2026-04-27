import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 30; // Max timeout for Vercel functions

export async function POST(req: Request) {
  try {
    const { raw_input } = await req.json();

    if (!raw_input || typeof raw_input !== 'string') {
      return NextResponse.json({ error: 'Missing raw_input' }, { status: 400 });
    }

    // Generate analysis ID to link this transient session to the final commit
    const analysis_id = uuidv4();

    // In the future, this is where we compute logic_embedding(rationale) 
    // and query Supabase pgvector for similar past decisions.
    
    // For now, we instruct Gemini to extract the structured data AND generate a challenger prompt
    // simultaneously to avoid race conditions and speed up the UX.
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        structured_data: z.object({
          context: z.string().describe('The background or context leading to this decision'),
          chosen_option: z.string().describe('The specific option or action the user decided to take'),
          discarded_options: z.array(z.string()).describe('Other options that were considered but rejected'),
          rationale: z.string().describe('The underlying reasoning for why this decision was made'),
          expected_outcome: z.string().describe('What the user explicitly expects to happen as a result'),
          confidence_level: z.number().min(1).max(100).describe('User confidence in this decision (1-100) based on their tone'),
        }),
        challenger_prompt: z.string().describe('A sharp, slightly uncomfortable question challenging a potential blindspot, bias, or flaw in their rationale. Max 2 sentences.'),
      }),
      prompt: `You are the Astra Mind Decision Memory Engine. 
      Your job is to parse a user's unstructured brain dump about a decision they just made.
      
      User Input:
      "${raw_input}"

      Tasks:
      1. Extract the structured components. If vague, infer reasonably based on context.
      2. Generate a 'Commit Gate Challenger'. 
         CRITICAL CONSTRAINTS FOR CHALLENGER:
         - MUST reference exact words/phrases from their text.
         - MUST identify a specific contradiction or blindspot in their logic.
         - MUST be uncomfortable and direct. 
         - DO NOT ask generic "what if" questions. Force cognitive accountability.`,
    });

    return NextResponse.json({
      analysis_id,
      structured_data: object.structured_data,
      challenger_prompt: object.challenger_prompt,
    });

  } catch (error) {
    console.error('API Analyze Error:', error);
    return NextResponse.json({ error: 'Failed to analyze decision' }, { status: 500 });
  }
}
