import { createClient } from '@/utils/supabase/client'

export type EventName =
  | 'decision_created'
  | 'review_started'
  | 'review_submitted'
  | 'ai_verdict_shown'
  | 'cta_clicked'
  | 'ai_feedback_given'
  | 'emotional_response_given'

/**
 * Fire-and-forget event tracker.
 * Writes to the `events` table in Supabase.
 * Does NOT throw — failure is silent so it never breaks the UI.
 */
export async function trackEvent(event_name: EventName, metadata?: Record<string, string | number>) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('events').insert({
      user_id: user.id,
      event_name,
      metadata: metadata ?? null,
    })
  } catch {
    // Silent fail — never break the user experience
  }
}
