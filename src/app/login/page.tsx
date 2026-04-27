import { login } from './actions'
import Link from 'next/link'

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string }>
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono selection:bg-indigo-500/30">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">ASTRA MIND</h1>
          <p className="text-sm text-gray-400">Authenticate to access Memory Engine</p>
        </div>

        <form className="flex flex-col gap-4">
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
              placeholder="Password"
              required
            />
          </div>

          {searchParams?.message && (
            <p className="mt-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-md text-center">
              {searchParams.message}
            </p>
          )}

          <div className="flex flex-col gap-4">
            <button
              formAction={login}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-medium transition-colors"
            >
              Log In
            </button>
            
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/signup" className="text-indigo-400 hover:text-indigo-300">
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
