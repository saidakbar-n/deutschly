import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Sparkles, LogIn } from 'lucide-react'
import { TelegramLoginPayload, WebSignupPayload } from '../hooks/useApi'

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramLoginPayload) => void
  }
}

function TelegramLoginButton({ onAuth }: { onAuth: (user: TelegramLoginPayload) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.onTelegramAuth = onAuth
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_NAME || 'Deutschly')
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true
    containerRef.current?.appendChild(script)
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [onAuth])

  return <div ref={containerRef} className="flex justify-center py-2 bg-white rounded-xl" />
}

export function Landing({
  onJoin,
  onLogin,
  onTelegramLogin,
}: {
  onJoin: (payload: WebSignupPayload) => Promise<any>
  onLogin: (u: string, p: string) => Promise<any>
  onTelegramLogin: (payload: TelegramLoginPayload) => Promise<any>
}) {
  const [form, setForm] = useState<WebSignupPayload>({ username: '', level: 'A1', city: '', password: '' })
  const [loginMode, setLoginMode] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [password, setPassword] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<number[] | null>(null)

  const handleTelegramAuth = async (user: TelegramLoginPayload) => {
    setStatus('Signing in with Telegram...')
    try {
      await onTelegramLogin(user)
    } catch (e) {
      setStatus('Telegram login failed')
    }
  }

  const submit = async () => {
    if (loginMode) {
      if (!form.username.trim() || !password) {
        setStatus('Enter username and password')
        return
      }
      setStatus('Signing in...')
      try {
        await onLogin(form.username, password)
      } catch (e) {
        setStatus('Invalid login')
      }
      return
    }
    if (!form.username.trim()) {
      setStatus('Pick a username to start')
      return
    }
    if (!password) {
      setStatus('Set a password')
      return
    }
    setStatus('Creating your space...')
    try {
      const u = await onJoin({ ...form, password })
      if ((u as any).recovery_codes) {
        setRecoveryCodes((u as any).recovery_codes)
        setStatus('Copy these recovery codes and keep them safe.')
      }
    } catch (e) {
      setStatus('Something went wrong — try again')
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
        <div className="card bg-white/10 border-white/20 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-white">{loginMode ? 'Welcome back' : 'Create your account'}</h3>
            <button className="text-sm text-white/80 underline" onClick={() => setLoginMode(!loginMode)}>
              {loginMode ? 'Need an account?' : 'I have an account'}
            </button>
          </div>
          <div className="space-y-3">
            <input
              className="w-full rounded-xl px-4 py-3 bg-white/90 text-slate-900"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
              className="w-full rounded-xl px-4 py-3 bg-white/90 text-slate-900"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            {!loginMode && (
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
            )}
            <input
              className="w-full rounded-xl px-4 py-3 bg-white/90 text-slate-900"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn-primary bg-white text-blue-600 flex items-center justify-center gap-2" onClick={submit}>
              {loginMode ? 'Login' : 'Join Deutschly'} {loginMode ? <LogIn size={18} /> : <ArrowRight size={18} />}
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-white/50">Or continue with</span>
              </div>
            </div>
            <TelegramLoginButton onAuth={handleTelegramAuth} />
            <p className="text-xs text-white/70 min-h-[1rem] text-center">{status}</p>
            {recoveryCodes && !loginMode && (
              <div className="mt-2 bg-slate-900/50 border border-white/20 rounded-xl p-3 text-left">
                <p className="text-sm font-semibold mb-1 text-white">Recovery codes</p>
                <p className="text-xs text-white/80 mb-2">Save these 5 numbers; they will not be shown again.</p>
                <div className="grid grid-cols-5 gap-2 text-center font-mono text-white">
                  {recoveryCodes.map((c) => (
                    <span key={c} className="bg-white/10 rounded-lg py-2 text-sm">
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
