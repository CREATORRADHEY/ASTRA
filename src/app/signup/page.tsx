import { signup } from '@/app/login/actions'
import Link from 'next/link'

export default async function SignupPage(props: {
  searchParams: Promise<{ message?: string }>
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-mono selection:bg-indigo-500/30 p-6 relative overflow-hidden" style={{
      background: 'radial-gradient(circle at 50% 20%, rgba(88, 70, 255, 0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255, 60, 60, 0.08), transparent 40%), radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.8) 100%), #0a0a0f'
    }}>
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-mode-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
      
      {/* FIX 1: Faint Background Text - Reduced Opacity & Blur */}
      <div className="absolute top-[15%] right-[10%] text-[8vw] font-bold text-white/[0.01] select-none pointer-events-none uppercase tracking-tighter rotate-[15deg] blur-[2px]">
        blind spot
      </div>
      <div className="absolute bottom-[15%] left-[10%] text-[8vw] font-bold text-white/[0.01] select-none pointer-events-none uppercase tracking-tighter rotate-[-15deg] blur-[2px]">
        calibration
      </div>

      <div className="w-full max-w-md bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl space-y-8 relative z-10" style={{
        boxShadow: '0 0 120px rgba(88, 70, 255, 0.15), 0 0 40px rgba(255, 60, 60, 0.08)'
      }}>
        
        {/* FIX 6: Demo Card Polish */}
        <div className="bg-black/40 border border-white/5 rounded-lg p-4 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">DEMO PROFILE (Example Output)</p>
            <p className="text-white font-bold">Calibration Score: <span className="text-orange-400">42</span></p>
            <p className="text-[9px] text-gray-500 italic mt-1">Based on past decisions vs outcomes</p>
          </div>
          <p className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 font-bold uppercase tracking-tighter">Overconfident</p>
        </div>

        <div className="text-center">
          {/* FIX 5: Signup Header Refinement */}
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] mb-2">Create your decision profile</p>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">ASTRA MIND</h1>
          <p className="text-sm text-gray-400">Start tracking your decisions and uncover how accurate your thinking really is.</p>
        </div>

        <form className="flex flex-col gap-6">
          {/* FIX 3 & 10: Spacing & Essentials First */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 uppercase tracking-wider" htmlFor="email">
              Email
            </label>
            <input
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <input
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
              id="password"
              name="password"
              type="password"
              placeholder="Min 8 chars, letters & numbers"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
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
              <label className="text-xs text-gray-500 uppercase tracking-wider opacity-50" htmlFor="profession">
                Profession (Optional)
              </label>
              <input
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
                id="profession"
                name="profession"
                type="text"
                placeholder="Product Manager"
              />
            </div>
            
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider opacity-50" htmlFor="country">
                Where? (Optional)
              </label>
              <input
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
                id="country"
                name="country"
                type="text"
                placeholder="US"
              />
            </div>
          </div>

          {searchParams?.message && (
            <p className="mt-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-md text-center animate-shake">
              {searchParams.message}
            </p>
          )}

          <div className="flex flex-col gap-6 pt-2">
            <div className="text-center space-y-1">
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest animate-pulse">⚠️ Honesty Check Required</p>
              <p className="text-[10px] text-gray-600 italic leading-tight">This only works if you&apos;re honest. <br /> You won&apos;t be able to change your past decisions.</p>
            </div>

            <div className="space-y-3">
              <button
                formAction={signup}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-md font-bold transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98] hover:scale-[1.02]"
              >
                {/* FIX 7: Sharper Signup CTA */}
                Start Measuring My Thinking
              </button>
              {/* FIX 4: Believable Claim */}
              <p className="text-[10px] text-gray-600 text-center uppercase tracking-widest">Takes ~30 seconds.</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium">Start building your Calibration Score today.</p>
                {/* FIX 10: Footer Contrast */}
                <p className="text-[10px] text-gray-400">We don&apos;t share your data. Your decisions stay private.</p>
              </div>
              
              <p className="text-sm text-gray-500 pt-4 border-t border-white/5">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 font-bold">
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </form>

        <p className="text-xs text-indigo-400 font-medium italic border-l-2 border-indigo-500/50 pl-4 py-1">
          &quot;You&apos;ll be forced to commit to your reasoning before reality proves you right or wrong.&quot;
        </p>
        
        <p className="text-center text-[10px] text-gray-400 uppercase tracking-[0.2em] pt-4 border-t border-white/5">
          Most users discover they were wrong by 30–50%.
        </p>
      </div>
    </div>
  )
}
