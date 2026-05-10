import { useState, useRef } from 'react'
import { ArrowRight, Sparkles, LogIn, ChevronLeft, UserPlus, Key, BookOpen, PenTool } from 'lucide-react'
import { WebSignupPayload, checkUsername } from '../hooks/useApi'

// ============================================
// QA Wolf-Style Illustrations
// ============================================

// Pixel art running wolf - matches QA Wolf's blue pixel wolf
const RunningWolfPixel = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 40"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Body - pixel art style matching QA Wolf */}
    <rect x="10" y="25" width="6" height="6" />
    <rect x="16" y="25" width="6" height="6" />
    <rect x="22" y="25" width="6" height="6" />
    <rect x="28" y="25" width="6" height="6" />
    <rect x="34" y="25" width="6" height="6" />
    <rect x="13" y="20" width="6" height="6" />
    <rect x="19" y="20" width="6" height="6" />
    <rect x="25" y="20" width="6" height="6" />
    <rect x="31" y="20" width="6" height="6" />
    <rect x="16" y="15" width="6" height="6" />
    <rect x="22" y="15" width="6" height="6" />
    <rect x="28" y="15" width="6" height="6" />
    <rect x="22" y="10" width="6" height="6" />
    {/* Head */}
    <rect x="34" y="20" width="6" height="6" />
    <rect x="40" y="20" width="6" height="6" />
    <rect x="37" y="15" width="6" height="6" />
    {/* Ears */}
    <rect x="34" y="10" width="6" height="6" />
    <rect x="40" y="10" width="6" height="6" />
    {/* Eyes - white pixels */}
    <rect x="36" y="17" width="2" height="2" fill="white" />
    <rect x="42" y="17" width="2" height="2" fill="white" />
    {/* Tail */}
    <rect x="4" y="25" width="6" height="6" />
    <rect x="4" y="31" width="6" height="6" />
    {/* Legs */}
    <rect x="10" y="31" width="6" height="6" />
    <rect x="16" y="31" width="6" height="6" />
    <rect x="34" y="31" width="6" height="6" />
    <rect x="40" y="31" width="6" height="6" />
  </svg>
)

// Line art wolf for section illustrations
const LineArtWolf = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 120 80"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Body */}
    <path d="M20 50 L80 50 L90 40 L100 45 L100 55 L90 60 L80 50" />
    {/* Head */}
    <path d="M80 50 L95 45 L105 42 L100 40 L105 38 L100 42" />
    <circle cx="100" cy="40" r="1.5" fill="currentColor" />
    <path d="M97 38 L103 38" />
    {/* Ears */}
    <path d="M95 35 L98 32 L101 35" />
    <path d="M101 35 L104 32 L107 35" />
    {/* Legs */}
    <path d="M30 60 L25 70" />
    <path d="M40 60 L35 70" />
    <path d="M70 60 L65 70" />
    <path d="M80 60 L75 70" />
    {/* Tail */}
    <path d="M20 50 L10 45 L5 50 L10 55 L20 50" />
  </svg>
)

// Static wolf illustration for hero
const HeroWolf = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 200 120"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Main body */}
    <path d="M40 80 L120 80 L140 60 L160 70 L160 90 L140 100 L120 80" />
    
    {/* Head */}
    <path d="M120 80 L140 70 L165 70 L160 60 L170 55 L165 50 L160 60" />
    
    {/* Eyes */}
    <circle cx="160" cy="65" r="2.5" fill="currentColor" />
    <path d="M157 63 L163 63" stroke="white" strokeWidth="1.5" />
    
    {/* Ears */}
    <path d="M140 55 L145 50 L150 55" />
    <path d="M155 50 L160 45 L165 50" />
    
    {/* Nose */}
    <path d="M170 55 L172 57 L170 59" fill="currentColor" />
    
    {/* Legs */}
    <path d="M60 95 L55 110" />
    <path d="M80 95 L75 110" />
    <path d="M110 95 L105 110" />
    <path d="M130 95 L125 110" />
    
    {/* Tail - curved */}
    <path d="M40 80 Q20 70 10 80 Q15 90 40 80" />
    
    {/* Belly */}
    <path d="M60 85 L100 85" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
  </svg>
)

// Arrow icon matching QA Wolf style
const QaWolfArrow = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12 L19 12" />
    <path d="M12 5 L19 12 L12 19" />
  </svg>
)

// Animated wolf that simulates running
const AnimatedRunningWolf = ({ className = '' }: { className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Container with overflow for running effect */}
    <div className="relative w-full h-full overflow-hidden">
      {/* Multiple wolf positions for smooth animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <RunningWolfPixel className="w-16 h-8 text-indigo-500 animate-qaw-wolf-run" />
      </div>
    </div>
  </div>
)

// Feature checkmark icon
const FeatureCheck = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 13 L9 17 L19 7" />
  </svg>
)

// ============================================
// Main Landing Component
// ============================================

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
    <div className="min-h-screen hero-bg text-slate-800">
      {/* Background pattern overlay */}
      <div className="fixed inset-0 bg-qaw-pattern" />
      
      {/* Decorative floating elements */}
      <div className="fixed top-20 left-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-qaw-float" style={{ animationDelay: '0s' }} />
      <div className="fixed bottom-40 right-20 w-48 h-48 bg-sky-100 rounded-full blur-3xl opacity-20 animate-qaw-float" style={{ animationDelay: '1s' }} />
      <div className="fixed top-1/2 right-10 w-24 h-24 bg-purple-100 rounded-full blur-2xl opacity-25 animate-qaw-float" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-16">
        {/* ============================================
            Hero Section - QA Wolf Style
        ============================================ */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg className="w-6 h-6 text-white" viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 2 H10 V4 H12 V6 H14 V10 H12 V12 H10 V14 H2 Z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gradient-indigo">Deutschly</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                Learn German.
                <br />
                <span className="inline-block animate-qaw-pulse">
                  <span className="text-gradient-indigo" style={{ animationDelay: '0s' }}>The </span>
                  <span className="text-gradient-indigo" style={{ animationDelay: '0.1s' }}>social </span>
                  <span className="text-gradient-indigo" style={{ animationDelay: '0.2s' }}>way.</span>
                </span>
              </h1>
              <p className="text-xl text-slate-600 max-w-lg">
                Social feed. Vocabulary builder. Structured grammar curriculum.
                <br />
                Built for German learners — <span className="text-indigo-600 font-medium">especially Uzbeks heading to Germany.</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                disabled={loading}
                className="btn-primary flex items-center justify-center gap-2"
                onClick={startSignup}
              >
                <UserPlus size={20} />
                Get started
              </button>
              <button
                disabled={loading}
                className="btn-secondary flex items-center justify-center gap-2"
                onClick={startLogin}
              >
                <Key size={20} />
                Sign in
              </button>
            </div>

            {/* Features List */}
            <div className="space-y-4 pt-4">
              {[
                 { text: 'Share your German learning journey', icon: <Sparkles size={16} /> },
                 { text: 'Build vocabulary — add words & quiz yourself', icon: <BookOpen size={16} /> },
                 { text: 'Grammar curriculum — Netzwerk Neu A1–C1', icon: <PenTool size={16} /> },
                 { text: 'Follow learners, grow your streak together', icon: <FeatureCheck className="w-5 h-5" /> },
               ].map((item, i) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 text-slate-700 opacity-0 animate-qaw-fade-in-up"
                  style={{ animationDelay: `${0.4 + i * 0.15}s` }}
                >
                  <div className="feature-icon">
                    {item.icon}
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Hero Illustration */}
          <div className="relative hidden lg:block">
            {/* Main wolf illustration */}
            <div className="relative w-full h-96">
              <div className="absolute top-0 right-0 w-80 h-80">
                <HeroWolf className="w-full h-full text-indigo-400 animate-qaw-float" />
              </div>
              
              {/* Animated running wolf overlay */}
              <div className="absolute bottom-16 left-8 w-48 h-16">
                <AnimatedRunningWolf />
              </div>
              
              {/* Small pixel wolves */}
              <div className="absolute top-12 right-12">
                <RunningWolfPixel className="w-8 h-4 text-indigo-300 opacity-60" />
              </div>
              <div className="absolute bottom-32 right-24">
                <RunningWolfPixel className="w-6 h-3 text-indigo-200 opacity-40" />
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-indigo-100 rounded-full blur-2xl opacity-50" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-sky-100 rounded-full blur-2xl opacity-40" />
          </div>
        </div>

        {/* ============================================
            How It Works - 3 Steps
        ============================================ */}
        <div className="mt-16 lg:mt-24">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Share your life',
                desc: 'Post with an attached vocab word. Your learning moments become social.',
                gradient: 'from-indigo-50 to-indigo-100',
                borderColor: 'border-indigo-200',
                textColor: 'text-indigo-600',
              },
              {
                step: '2',
                title: 'Learn words',
                desc: 'Build your vocabulary list, quiz yourself, save words from the community feed.',
                gradient: 'from-purple-50 to-purple-100',
                borderColor: 'border-purple-200',
                textColor: 'text-purple-600',
              },
              {
                step: '3',
                title: 'Practice grammar',
                desc: 'Work through the Netzwerk Neu curriculum, chapter by chapter, with AI feedback.',
                gradient: 'from-sky-50 to-sky-100',
                borderColor: 'border-sky-200',
                textColor: 'text-sky-600',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`card bg-gradient-to-br ${item.gradient} border ${item.borderColor} opacity-0 animate-qaw-fade-in-up`}
                style={{ animationDelay: `${0.8 + i * 0.15}s` }}
              >
                <div className="text-center space-y-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto bg-white shadow-sm`}>
                    <span className={`text-xl font-bold ${item.textColor}`}>{item.step}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================
            Auth Form Card - QA Wolf Style
        ============================================ */}
        <div className="mt-16 lg:mt-24">
          <div className="max-w-2xl mx-auto">
            <div ref={formRef} className="card animate-qaw-fade-in-up" style={{ animationDelay: '0.6s' }}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                {step !== 'welcome' && (
                  <button
                    onClick={goBack}
                    className="p-2 -ml-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    {step === 'welcome' ? 'Join Deutschly' : isLogin ? 'Welcome back' : 'Create account'}
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {step === 'welcome' ? (
                  <>
                    <p className="text-center text-slate-500 mb-2">
                      Start your German learning journey today
                    </p>
                    <p className="text-center text-sm text-slate-400 mb-6">
                      Free forever. No credit card needed.
                    </p>
                  </>
                ) : step === 'username' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 ml-1">
                        {isLogin ? 'Username' : 'Choose username'}
                      </label>
                      <input
                        className="input-primary"
                        placeholder="e.g., deutschlerner"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                        autoFocus
                      />
                    </div>
                    <button
                      disabled={loading || !form.username.trim()}
                      className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleContinue}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-qaw-spin" />
                      ) : (
                        <>
                          Continue
                          <QaWolfArrow className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    <button
                      className="w-full text-sm text-slate-500 hover:text-indigo-600 transition-colors"
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
                          <label className="block text-sm font-medium text-slate-700 ml-1">City</label>
                          <input
                            className="input-primary"
                            placeholder="Berlin"
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-slate-700 ml-1">Level</label>
                          <select
                            className="input-primary"
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
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 ml-1">Password</label>
                      <input
                        className="input-primary"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submit()}
                        autoFocus
                      />
                      {!isLogin && (
                        <p className="text-xs text-slate-500 ml-1">Minimum 6 characters</p>
                      )}
                    </div>
                    <button
                      disabled={loading}
                      className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                      onClick={goBack}
                    >
                      Back
                    </button>
                  </>
                )}

                {/* Status message */}
                <p className={"text-sm text-center font-medium min-h-[1.25rem] transition-colors duration-200 " + (
                  status.includes('error') || status.includes('Invalid') || status.includes('Could not') 
                    ? 'text-red-500' 
                    : status.includes('created') || status.includes('Welcome')
                      ? 'text-green-600'
                      : 'text-slate-500'
                )}>
                  {status}
                </p>

                {/* Recovery codes */}
                {recoveryCodes && (
                  <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-left animate-qaw-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <p className="text-sm font-semibold mb-1 text-slate-900">
                      Save these recovery codes
                    </p>
                    <p className="text-xs text-slate-500 mb-3">
                      These 5 numbers can help recover your account. They will not be shown again.
                    </p>
                    <div className="grid grid-cols-5 gap-2 text-center font-mono text-slate-700">
                      {recoveryCodes.map((c) => (
                        <span key={c} className="bg-white rounded-lg py-2 text-sm border border-slate-200">
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

      {/* Footer */}
      <div className="relative z-10 mt-16 text-center text-sm text-slate-400">
        <p>© 2026 Deutschly. All rights reserved.</p>
      </div>
    </div>
  )
}
