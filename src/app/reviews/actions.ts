'use server'

import { createClient } from '@/utils/supabase/server'

export async function getPendingReviews() {
  const supabase = await createClient()
  
  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // 2. Fetch pending decisions and their structured context
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select(`
      id,
      created_at,
      structured_data (
        context
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    return []
  }

  // 3. Map to the frontend shape
  return decisions.map((d: any) => {
    // Calculate simple relative time (e.g. "2 hours ago")
    const hours = Math.floor((Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60))
    const dateStr = hours > 24 ? `${Math.floor(hours / 24)} days ago` : `${hours} hours ago`

    return {
      id: d.id,
      date: dateStr,
      context: d.structured_data?.[0]?.context || d.structured_data?.context || "Context not found",
    }
  })
}
