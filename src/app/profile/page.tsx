import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/login/actions'

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

            <div className="bg-black/50 border border-white/5 rounded-lg p-6 space-y-6 flex flex-col justify-center">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Calibration Score</p>
                <p className="text-4xl font-bold text-indigo-400">{profile?.calibration_score || 50}</p>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Decisions</p>
                <p className="text-2xl font-bold text-gray-200">{profile?.total_decisions || 0}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 mt-8 flex justify-end">
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
