import { login } from './actions'
import Link from 'next/link'

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string }>
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono selection:bg-indigo-500/30 p-6">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl p-8 shadow-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">ASTRA MIND</h1>
          {/* FIX 1: Replace Subtitle + Add Tension Line */}
          <p className="text-xs text-red-500 font-bold uppercase tracking-widest mb-4">Most people are wrong more often than they think.</p>
          <p className="text-sm text-gray-400">Access your decision history and see how accurate your thinking really is.</p>
        </div>

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 uppercase tracking-wider" htmlFor="email">
              Email
            </label>
            <input
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
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
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              required
            />
          </div>

          {searchParams?.message && (
            <p className="mt-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-md text-center">
              {searchParams.message}
            </p>
          )}

          <div className="flex flex-col gap-6">
            <button
              formAction={login}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-bold transition-all shadow-lg shadow-indigo-900/20"
            >
              {/* FIX 3: Weak CTA */}
              Enter the Engine
            </button>
            
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
                Sign Up
              </Link>
            </p>
          </div>
        </form>

        {/* FIX 2: Value Reminder Section */}
        <div className="border-t border-white/5 pt-8 space-y-4">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest text-center">Inside the Engine</p>
          <ul className="grid grid-cols-1 gap-3">
            {[
              "Track decisions before outcomes",
              "Compare expectation vs reality",
              "Get brutally honest AI feedback",
              "Build your Calibration Score"
            ].map((point, i) => (
              <li key={i} className="flex items-center gap-3 text-xs text-gray-400">
                <span className="text-indigo-500">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
