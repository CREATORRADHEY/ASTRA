import { signup } from '@/app/login/actions'
import Link from 'next/link'

export default async function SignupPage(props: {
  searchParams: Promise<{ message?: string }>
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono selection:bg-indigo-500/30 p-6">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl p-8 shadow-2xl space-y-8">
        
        {/* OPTIONAL: Mini Preview Card */}
        <div className="bg-black/40 border border-white/5 rounded-lg p-4 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sample Profile</p>
            <p className="text-white font-bold">Calibration Score: <span className="text-orange-400">42</span></p>
          </div>
          <p className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 font-bold uppercase tracking-tighter">Overconfident</p>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">ASTRA MIND</h1>
          {/* FIX 4: Replace Subtitle + Add Hook Line */}
          <p className="text-sm text-gray-400 mb-4">Start tracking your decisions and uncover how accurate your thinking really is.</p>
          <p className="text-xs text-indigo-400 font-medium italic border-l-2 border-indigo-500/50 pl-4 py-1">
            &quot;You&apos;ll be forced to commit to your reasoning before reality proves you right or wrong.&quot;
          </p>
        </div>

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            {/* FIX 6: Update Labels */}
            <label className="text-xs text-gray-500 uppercase tracking-wider" htmlFor="full_name">
              Who are you? (Full Name)
            </label>
            <input
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider" htmlFor="profession">
                What do you do? (Profession)
              </label>
              <input
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
                id="profession"
                name="profession"
                type="text"
                placeholder="Product Manager"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider" htmlFor="country">
                Where are you based? (Country)
              </label>
              <input
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
                id="country"
                name="country"
                type="text"
                placeholder="United States"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 uppercase tracking-wider" htmlFor="email">
              Email
            </label>
            <input
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
              id="email"
              name="email"
              type="email"
              placeholder="founder@startup.com"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <input
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
              id="password"
              name="password"
              type="password"
              placeholder="8+ chars, letters & numbers"
              required
            />
          </div>

          {searchParams?.message && (
            <p className="mt-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-md text-center">
              {searchParams.message}
            </p>
          )}

          <div className="flex flex-col gap-6">
            {/* FIX 5: Friction Warning */}
            <div className="text-center space-y-1">
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest animate-pulse">⚠️ Honesty Check Required</p>
              <p className="text-[10px] text-gray-600 italic">This only works if you&apos;re honest. You won&apos;t be able to change your past decisions.</p>
            </div>

            <button
              formAction={signup}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-bold transition-all shadow-lg shadow-indigo-900/20"
            >
              Sign Up & Begin Calibration
            </button>
            
            <div className="text-center space-y-4">
              {/* FIX 8: Why Sign Up Push */}
              <p className="text-xs text-gray-400 font-medium">Start building your Calibration Score today.</p>
              
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </form>
        
        {/* FIX 7: Footer Hook */}
        <p className="text-center text-[10px] text-gray-600 uppercase tracking-[0.2em] pt-4 border-t border-white/5">
          Most users discover they were wrong by 30–50%.
        </p>
      </div>
    </div>
  )
}
