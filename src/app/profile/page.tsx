import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/login/actions'

function getCalibrationLabel(score: number): { label: string; color: string } {
  if (score < 30) return { label: 'Delusional', color: 'text-red-500' }
  if (score < 50) return { label: 'Uncalibrated', color: 'text-orange-400' }
  if (score < 70) return { label: 'Average', color: 'text-yellow-400' }
  if (score < 85) return { label: 'Sharp', color: 'text-indigo-400' }
  return { label: 'Dangerous Thinker', color: 'text-emerald-400' }
}

function getInsightPattern(decisions: any[]): { pattern: string; count: number } | null {
  // Fix 5: Require at least 7 total decisions before surfacing any pattern
  if (!decisions || decisions.length < 7) return null

  const resolved = decisions.filter(d => d.status === 'resolved' && d.structured_data)
  if (resolved.length < 7) return null

  let overconfidentCount = 0
  let underconfidentCount = 0

  for (const d of resolved) {
    const conf = d.structured_data?.confidence_level || d.structured_data?.[0]?.confidence_level || 50
    const success = d.success_rating || 50
    if (conf > 65 && success < 50) overconfidentCount++
    if (conf < 40 && success > 65) underconfidentCount++
  }

  // Feature 5: Require at least 3 matching occurrences for a reliable pattern
  if (overconfidentCount >= 3) return { pattern: 'Overconfidence in uncertain situations', count: overconfidentCount }
  if (underconfidentCount >= 3) return { pattern: 'Underconfidence — you perform better than you predict', count: underconfidentCount }
  return null
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: decisions } = await supabase
    .from('decisions')
    .select('status, success_rating, structured_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const score = profile?.calibration_score || 50
  const { label, color } = getCalibrationLabel(score)
  const insightPattern = getInsightPattern(decisions || [])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EAEAEA] font-mono selection:bg-indigo-500/30">
      <header className="border-b border-white/10 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">ASTRA MIND</h1>
          <p className="text-sm text-gray-400">Decision Memory Engine</p>
        </div>
        <nav className="flex gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">Capture</Link>
          <Link href="/reviews" className="text-gray-400 hover:text-white transition-colors">Reviews</Link>
          <Link href="/profile" className="text-white border-b-2 border-indigo-500 pb-1">Profile</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto p-6 mt-8">
        <h2 className="text-2xl font-medium text-white mb-6">User Profile</h2>
        
        <div className="bg-[#111] border border-white/10 rounded-xl p-8 shadow-2xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-lg text-white font-medium">{profile?.full_name || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <p className="text-gray-300">{user.email}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Profession</p>
                <p className="text-gray-300">{profile?.profession || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Country</p>
                <p className="text-gray-300">{profile?.country || 'N/A'}</p>
              </div>
            </div>

            {/* Calibration Score + Identity */}
            <div className="bg-black/50 border border-white/5 rounded-lg p-6 space-y-6 flex flex-col justify-center">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Calibration Score</p>
                <p className="text-5xl font-bold text-white">{score}</p>
                <p className={`text-sm font-semibold mt-2 uppercase tracking-widest ${color}`}>
                  You are: {label}
                </p>
                {/* FIX 5: Tension under score */}
                <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-md">
                  <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-tighter">
                    This score reflects how accurately you see reality. 
                    <br />
                    <span className="text-indigo-400 font-bold">Most people overestimate themselves.</span>
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Decisions</p>
                <p className="text-2xl font-bold text-gray-200">{profile?.total_decisions || 0}</p>
                {/* FIX 5: Callout if 0 decisions */}
                {(profile?.total_decisions || 0) === 0 && (
                  <p className="text-[10px] text-red-500 font-bold uppercase mt-2 animate-pulse">
                    You haven&apos;t tested your thinking yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* First Insight Layer — unlocked after 5 decisions with 3+ pattern matches */}
          {insightPattern && (
            <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/30 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <p className="text-purple-400 text-xs font-medium uppercase tracking-wider">Reliable Pattern Detected ({insightPattern.count} occurrences)</p>
              </div>
              <p className="text-white font-medium text-sm">
                Your biggest weakness:{' '}
                <span className="text-purple-300">{insightPattern.pattern}</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Based on your last {decisions?.filter(d => d.status === 'resolved').length} resolved decisions.
              </p>
            </div>
          )}

          {/* Not enough data for reliable pattern yet */}
          {!insightPattern && (profile?.total_decisions || 0) >= 7 && (
            <div className="bg-black/30 border border-white/5 border-dashed rounded-lg p-5 text-center">
              <p className="text-gray-600 text-sm italic">
                &quot;Your thinking patterns are still hidden.&quot;
              </p>
              <p className="text-gray-700 text-xs mt-1 uppercase tracking-widest">Calibration Phase Active</p>
            </div>
          )}

          {/* FIX 6: Locked teaser — fewer than 7 decisions */}
          {!insightPattern && (profile?.total_decisions || 0) < 7 && (
            <div className="bg-black/30 border border-white/5 border-dashed rounded-lg p-8 text-center space-y-4">
              <div className="text-2xl opacity-30 grayscale">🕵️‍♂️</div>
              <div>
                <p className="text-gray-400 font-medium">Your thinking patterns are still hidden.</p>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Log <span className="text-indigo-400 font-bold">{Math.max(0, 7 - (profile?.total_decisions || 0))} more decisions</span> to uncover your biggest blind spot.
                </p>
              </div>
              <Link 
                href="/" 
                className="inline-block text-xs text-indigo-400 underline underline-offset-4 font-bold uppercase tracking-widest hover:text-indigo-300 transition-colors"
              >
                Capture Decision →
              </Link>
            </div>
          )}

          <div className="border-t border-white/10 pt-8 flex justify-end">
            <form action={logout}>
              <button className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 px-6 py-2 rounded-md font-medium transition-colors w-full sm:w-auto">
                Secure Logout
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
