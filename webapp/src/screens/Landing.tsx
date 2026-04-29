import { useState } from 'react'
import { ArrowRight, Sparkles, LogIn, ChevronLeft, UserPlus, Key } from 'lucide-react'
import { WebSignupPayload, checkUsername } from '../hooks/useApi'

export function Landing({
  onJoin,
  onLogin,
}: {
  onJoin: (payload: WebSignupPayload) => Promise<any>
  onLogin: (u: string, p: string) => Promise<any>
}) {
  const [form, setForm] = useState<WebSignupPayload>({ username: '', level: 'A1', city: '', password: '' })
  const [step, setStep] = useState<'welcome' | 'username' | 'auth'>('welcome')
  const [isLogin, setIsLogin] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [password, setPassword] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<number[] | null>(null)
  const [loading, setLoading] = useState(false)

  const startLogin = () => {
    setIsLogin(true)
    setStep('username')
  }

  const startSignup = () => {
    setIsLogin(false)
    setStep('username')
  }

  const handleContinue = async () => {
    if (!form.username.trim()) {
      setStatus('Enter a username')
      return
    }
    setLoading(true)
    setStatus('')
    try {
      const { exists } = await checkUsername(form.username)
      // If user wants to login but username doesn't exist, redirect to signup
      if (isLogin && !exists) {
        setIsLogin(false)
        setStatus('New user? Complete your signup below')
        setStep('auth')
        setLoading(false)
        return
      }
      // If user wants to signup but username exists, redirect to login
      if (!isLogin && exists) {
        setIsLogin(true)
        setStatus('User already exists. Please login.')
        setStep('auth')
        setLoading(false)
        return
      }
      setIsLogin(exists)
      setStep('auth')
    } catch (e) {
      setStatus('Connection error. Try again.')
    } finally {
      if (loading) setLoading(false)
    }
  }

  const submit = async () => {
    if (isLogin) {
      if (!password) {
        setStatus('Enter your password')
        return
      }
      setLoading(true)
      setStatus('Signing in...')
      try {
        await onLogin(form.username, password)
      } catch (e) {
        setStatus('Invalid password or username')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!password || password.length < 6) {
      setStatus('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setStatus('Creating your account...')
    try {
      const u = await onJoin({ ...form, password })
      if ((u as any).recovery_codes) {
        setRecoveryCodes((u as any).recovery_codes)
        setStatus('Account created! Save these codes.')
      }
    } catch (e) {
      setStatus('Could not create account — try a different username')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    if (step === 'username') {
      setStep('welcome')
      setForm({ username: '', level: 'A1', city: '', password: '' })
      setPassword('')
      setStatus('')
    } else if (step === 'auth') {
      setStep('username')
      setPassword('')
      setStatus('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white flex items-center justify-center p-6">
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm">
            <Sparkles size={16} /> New: Web experience is live
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">Deutschly on the web</h1>
          <p className="text-lg text-white/80">
            Share learning wins, follow other learners, and keep your streak all in one place on the web.
          </p>
          <ul className="text-white/80 space-y-1 text-sm">
            <li>• Post stories, achievements, and tips</li>
            <li>• Discover nearby learners by city and level</li>
            <li>• Save your profile and keep progress synced</li>
          </ul>
        </div>
        <div className="card bg-white/10 border-white/20 backdrop-blur min-h-[400px] flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-6">
            {step !== 'welcome' && (
              <button onClick={goBack} className="p-1 hover:bg-white/10 rounded-lg">
                <ChevronLeft size={20} />
              </button>
            )}
            <h3 className="text-2xl font-bold text-white">
              {step === 'welcome' ? 'Welcome' : isLogin ? 'Login' : 'Create account'}
            </h3>
          </div>

          <div className="space-y-4">
            {step === 'welcome' ? (
              <>
                <p className="text-center text-white/80 mb-6">Join Deutschly community today</p>
                <div className="space-y-3">
                  <button
                    disabled={loading}
                    className="w-full btn-primary bg-white text-blue-600 py-4 flex items-center justify-center gap-2 text-lg font-semibold hover:bg-blue-50 transition-colors"
                    onClick={startLogin}
                  >
                    <Key size={20} /> Login
                  </button>
                  <button
                    disabled={loading}
                    className="w-full btn-primary bg-blue-500/20 text-white border border-white/30 py-4 flex items-center justify-center gap-2 text-lg font-semibold hover:bg-blue-500/30 transition-colors"
                    onClick={startSignup}
                  >
                    <UserPlus size={20} /> Create new account
                  </button>
                </div>
              </>
            ) : step === 'username' ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm text-white/60 ml-1">
                    {isLogin ? 'Your username' : 'Choose a username'}
                  </label>
                  <input
                    className="w-full rounded-xl px-4 py-3 bg-white/90 text-slate-900 text-lg"
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                    autoFocus
                  />
                </div>
                <button
                  disabled={loading || !form.username.trim()}
                  className="w-full btn-primary bg-white text-blue-600 py-4 flex items-center justify-center gap-2 text-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
                  onClick={handleContinue}
                >
                  {loading ? 'Checking...' : 'Continue'} <ArrowRight size={20} />
                </button>
                <button
                  className="w-full text-sm text-white/60 hover:text-white transition-colors"
                  onClick={goBack}
                >
                  {isLogin ? 'Need to create an account?' : 'Already have an account?'}
                </button>
              </>
            ) : (
              <>
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm text-white/60 ml-1">City</label>
                      <input
                        className="w-full rounded-xl px-4 py-3 bg-white/90 text-slate-900"
                        placeholder="Berlin"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-white/60 ml-1">Level</label>
                      <select
                        className="w-full rounded-xl px-4 py-3 bg-white/90 text-slate-900"
                        value={form.level}
                        onChange={(e) => setForm({ ...form, level: e.target.value as WebSignupPayload['level'] })}
                      >
                        {['A1', 'A2', 'B1', 'B2', 'C1'].map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm text-white/60 ml-1">Password</label>
                  <input
                    className="w-full rounded-xl px-4 py-3 bg-white/90 text-slate-900"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    autoFocus
                  />
                </div>
                <button
                  disabled={loading}
                  className="w-full btn-primary bg-white text-blue-600 py-4 flex items-center justify-center gap-2 text-lg font-semibold hover:bg-blue-50 transition-colors"
                  onClick={submit}
                >
                  {loading ? 'Processing...' : isLogin ? 'Login' : 'Create account'} 
                  {isLogin ? <LogIn size={20} /> : <Sparkles size={20} />}
                </button>
                <button
                  className="w-full text-sm text-white/60 hover:text-white transition-colors"
                  onClick={goBack}
                >
                  Back
                </button>
              </>
            )}

            <p className="text-sm text-white/80 min-h-[1.25rem] text-center font-medium">{status}</p>
            
            {recoveryCodes && (
              <div className="mt-2 bg-slate-900/50 border border-white/20 rounded-xl p-4 text-left animate-in fade-in slide-in-from-bottom-2">
                <p className="text-sm font-semibold mb-1 text-white">Recovery codes</p>
                <p className="text-xs text-white/60 mb-3">Save these 5 numbers; they will not be shown again.</p>
                <div className="grid grid-cols-5 gap-2 text-center font-mono text-white">
                  {recoveryCodes.map((c) => (
                    <span key={c} className="bg-white/20 rounded-lg py-2 text-sm">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
