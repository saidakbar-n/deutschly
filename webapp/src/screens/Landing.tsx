import { useState, useRef } from 'react'
import { ArrowRight, Sparkles, LogIn, ChevronLeft, UserPlus, Key, BookOpen, PenTool, Check } from 'lucide-react'
import { WebSignupPayload, checkUsername } from '../hooks/useApi'

const FeatureCheck = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13 L9 17 L19 7" />
  </svg>
)

export function Landing({
  onJoin,
  onLogin,
}: {
  onJoin: (payload: WebSignupPayload) => Promise<any>
  onLogin: (u: string, p: string) => Promise<any>
}) {
  const [form, setForm] = useState<Omit<WebSignupPayload, 'password'>>({ username: '', level: 'A1', city: '' })
  const [step, setStep] = useState<'welcome' | 'username' | 'auth'>('welcome')
  const [isLogin, setIsLogin] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [password, setPassword] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<number[] | null>(null)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const startLogin = () => {
    setIsLogin(true)
    setStep('username')
    scrollToForm()
  }

  const startSignup = () => {
    setIsLogin(false)
    setStep('username')
    scrollToForm()
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
      if (isLogin && !exists) {
        setIsLogin(false)
        setStatus('New user? Complete your signup below')
        setStep('auth')
        setLoading(false)
        return
      }
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
      setLoading(false)
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

  const toggleAuthMode = () => {
    setIsLogin(prev => !prev)
    setPassword('')
    setStatus('')
  }

  const goBack = () => {
    if (step === 'username') {
      setStep('welcome')
      setForm({ username: '', level: 'A1', city: '' })
      setPassword('')
      setStatus('')
    } else if (step === 'auth') {
      setStep('username')
      setPassword('')
      setStatus('')
    }
  }

  return (
    <div className="min-h-dvh hero-bg text-slate-800">
      <div className="fixed inset-0 bg-qaw-pattern" />
      
      <div className="fixed top-20 left-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-qaw-float" style={{ animationDelay: '0s' }} />
      <div className="fixed bottom-40 right-20 w-48 h-48 bg-sky-100 rounded-full blur-3xl opacity-20 animate-qaw-float" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-0 sm:px-4">
        {/* ============================================
            Hero Section — compact on mobile
        ============================================ */}
        <div className="px-4 sm:px-0 pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8 md:pb-12">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            <div className="space-y-5 sm:space-y-7">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-sky-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges">
                    <path d="M2 2 H10 V4 H12 V6 H14 V10 H12 V12 H10 V14 H2 Z" />
                  </svg>
                </div>
                <span className="text-base sm:text-xl font-bold text-gradient-indigo">Deutschly</span>
              </div>

              {/* Headline — condensed on small screens */}
              <div className="space-y-3 sm:space-y-5">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Learn German.
                  <br />
                  <span className="text-gradient-indigo">The social way.</span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-lg leading-relaxed">
                  Social feed. Vocabulary builder. Structured grammar curriculum — for German learners heading to Germany.
                </p>
              </div>

              {/* CTA Buttons — compact row on mobile */}
              <div className="flex flex-row gap-2.5 sm:gap-4">
                <button
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all duration-300 active:translate-y-[1px] disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px]"
                  onClick={startSignup}
                >
                  <UserPlus size={18} />
                  <span>Get started</span>
                </button>
                <button
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-white text-indigo-600 px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold border-2 border-indigo-600 transition-all duration-300 active:translate-y-[1px] disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px]"
                  onClick={startLogin}
                >
                  <Key size={18} />
                  <span>Sign in</span>
                </button>
              </div>

              {/* Features — 2-column on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {[
                  { text: 'Share your journey', icon: <Sparkles size={14} /> },
                  { text: 'Build vocabulary & quiz', icon: <BookOpen size={14} /> },
                  { text: 'Grammar A1–C1 curriculum', icon: <PenTool size={14} /> },
                  { text: 'Follow learners, grow streak', icon: <FeatureCheck className="w-4 h-4" /> },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-white/60 rounded-xl px-3 py-2.5 border border-slate-100">
                    <span className="text-indigo-500 shrink-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero illustration — desktop only */}
            <div className="relative hidden lg:block">
              <div className="w-full h-80 flex items-center justify-center">
                <div className="w-64 h-64 bg-gradient-to-br from-indigo-100 to-sky-50 rounded-[3rem] flex items-center justify-center shadow-2xl">
                  <svg className="w-32 h-32 text-indigo-400" viewBox="0 0 200 120" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M40 80 L120 80 L140 60 L160 70 L160 90 L140 100 L120 80" />
                    <path d="M120 80 L140 70 L165 70 L160 60 L170 55 L165 50 L160 60" />
                    <circle cx="160" cy="65" r="2.5" fill="currentColor" />
                    <path d="M140 55 L145 50 L150 55" />
                    <path d="M155 50 L160 45 L165 50" />
                    <path d="M170 55 L172 57 L170 59" fill="currentColor" />
                    <path d="M60 95 L55 110" />
                    <path d="M80 95 L75 110" />
                    <path d="M110 95 L105 110" />
                    <path d="M130 95 L125 110" />
                    <path d="M40 80 Q20 70 10 80 Q15 90 40 80" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================
            How It Works — 3 Steps
        ============================================ */}
        <div className="px-4 sm:px-0 pb-6 sm:pb-8 md:pb-12">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 text-center mb-4 sm:mb-6">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { step: '1', title: 'Share your life', desc: 'Post with vocab words. Learning becomes social.', gradient: 'from-indigo-50 to-indigo-100', borderColor: 'border-indigo-200', textColor: 'text-indigo-600' },
              { step: '2', title: 'Learn words', desc: 'Build vocabulary, quiz yourself, save from feed.', gradient: 'from-purple-50 to-purple-100', borderColor: 'border-purple-200', textColor: 'text-purple-600' },
              { step: '3', title: 'Practice grammar', desc: 'Netzwerk Neu curriculum with AI feedback.', gradient: 'from-sky-50 to-sky-100', borderColor: 'border-sky-200', textColor: 'text-sky-600' },
            ].map((item) => (
              <div key={item.step} className={`bg-gradient-to-br ${item.gradient} border ${item.borderColor} rounded-2xl p-4 sm:p-5 shadow-lg shadow-slate-100`}>
                <div className="text-center space-y-2 sm:space-y-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto bg-white shadow-sm">
                    <span className={`text-lg sm:text-xl font-bold ${item.textColor}`}>{item.step}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================
            Auth Form
        ============================================ */}
        <div className="px-4 sm:px-0 pb-8 sm:pb-12 md:pb-16">
          <div className="max-w-md mx-auto">
            <div ref={formRef} className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-5 sm:p-7">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                {step !== 'welcome' && (
                  <button onClick={goBack} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {step === 'welcome' ? 'Join Deutschly' : isLogin ? 'Welcome back' : 'Create account'}
                  </h3>
                  {step === 'welcome' && (
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Free forever. No credit card needed.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {step === 'welcome' ? (
                  <p className="text-center text-slate-500 text-sm sm:text-base mb-4">
                    Start your German learning journey today
                  </p>
                ) : step === 'username' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        {isLogin ? 'Username' : 'Choose username'}
                      </label>
                      <input
                        className="w-full rounded-xl px-4 py-3.5 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base min-h-[48px]"
                        placeholder="e.g., deutschlerner"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-z0-9_]/g, '').slice(0, 30) })}
                        onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                        autoFocus
                        inputMode="text"
                        autoCapitalize="none"
                        autoCorrect="off"
                      />
                    </div>
                    <button
                      disabled={loading || !form.username.trim()}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all duration-300 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                      onClick={handleContinue}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-qaw-spin" />
                      ) : (
                        <>
                          Continue
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                    <button
                      className="w-full text-sm text-slate-500 hover:text-indigo-600 transition-colors py-2 min-h-[44px]"
                      onClick={toggleAuthMode}
                    >
                      {isLogin ? 'New here? Create account' : 'Already have an account?'}
                    </button>
                  </>
                ) : (
                  <>
                    {!isLogin && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-slate-700">City</label>
                          <input
                            className="w-full rounded-xl px-4 py-3.5 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base min-h-[48px]"
                            placeholder="Berlin"
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                            inputMode="text"
                            autoCapitalize="words"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-slate-700">Level</label>
                          <select
                            className="w-full rounded-xl px-4 py-3.5 border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base min-h-[48px]"
                            value={form.level}
                            onChange={(e) => setForm({ ...form, level: e.target.value as WebSignupPayload['level'] })}
                          >
                            {['A1', 'A2', 'B1', 'B2', 'C1'].map((level) => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">Password</label>
                      <input
                        className="w-full rounded-xl px-4 py-3.5 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base min-h-[48px]"
                        type="password"
                        placeholder={isLogin ? 'Enter password' : 'Create password (min 6 chars)'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submit()}
                        autoFocus
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                      />
                    </div>
                    <button
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all duration-300 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                      onClick={submit}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-qaw-spin" />
                      ) : (
                        <>
                          {isLogin ? 'Sign in' : 'Create account'}
                          {isLogin ? <LogIn size={18} /> : <Sparkles size={18} />}
                        </>
                      )}
                    </button>
                    <button
                      className="w-full text-sm text-slate-500 hover:text-indigo-600 transition-colors py-2 min-h-[44px]"
                      onClick={goBack}
                    >
                      Back
                    </button>
                  </>
                )}

                <p className={"text-sm text-center font-medium min-h-[1.25rem] " + (
                  status.includes('error') || status.includes('Invalid') || status.includes('Could not') 
                    ? 'text-red-500' 
                    : status.includes('created') || status.includes('Welcome')
                      ? 'text-green-600'
                      : 'text-slate-500'
                )}>
                  {status}
                </p>

                {recoveryCodes && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 animate-qaw-fade-in-up">
                    <p className="text-sm font-semibold mb-1 text-slate-900">Save these recovery codes</p>
                    <p className="text-xs text-slate-500 mb-3">These 5 numbers can help recover your account.</p>
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center font-mono text-slate-700">
                      {recoveryCodes.map((c) => (
                        <span key={c} className="bg-white rounded-lg py-2 text-xs sm:text-sm border border-slate-200 font-semibold">
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
      </div>

      <div className="text-center text-xs sm:text-sm text-slate-400 pb-6">
        <p>© 2026 Deutschly</p>
      </div>
    </div>
  )
}
