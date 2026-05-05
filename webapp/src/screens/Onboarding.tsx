import { useState } from 'react'
import { updateUser, createWord, User } from '../hooks/useApi'

const LEVELS = [
  { value: 'A1', label: 'A1', desc: 'Complete beginner' },
  { value: 'A2', label: 'A2', desc: 'Basic phrases' },
  { value: 'B1', label: 'B1', desc: 'Intermediate' },
  { value: 'B2', label: 'B2', desc: 'Upper intermediate' },
  { value: 'C1', label: 'C1', desc: 'Advanced' },
]

export function Onboarding({ user, onDone }: { user: User; onDone: (u: User) => void }) {
  const [step, setStep] = useState(1)
  const [level, setLevel] = useState(user.level || 'A1')
  const [term, setTerm] = useState('')
  const [meaning, setMeaning] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLevelNext = async () => {
    setLoading(true)
    const updated = await updateUser(user.id, { level })
    setLoading(false)
    setStep(2)
  }

  const handleWordNext = async () => {
    if (term.trim() && meaning.trim()) {
      setLoading(true)
      await createWord({ user_id: user.id, term: term.trim(), meaning: meaning.trim() })
      setLoading(false)
    }
    setStep(3)
  }

  const handleDone = async () => {
    setLoading(true)
    const updated = await updateUser(user.id, { level })
    onDone(updated)
  }

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-indigo-600' : s < step ? 'w-2 bg-indigo-300' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1 — Level */}
        {step === 1 && (
          <div className="card space-y-6 animate-qaw-fade-in-up">
            <div className="text-center">
              <p className="text-4xl mb-3">🐺</p>
              <h1 className="text-2xl font-bold text-slate-900">Welcome to Deutschly!</h1>
              <p className="text-slate-500 mt-2">What's your current German level?</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    level === l.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-indigo-200'
                  }`}
                  onClick={() => setLevel(l.value as User['level'])}
                >
                  <div className="flex items-center gap-3">
                    <span className={`level-badge level-${l.value.toLowerCase()}`}>{l.label}</span>
                    <span className="text-slate-600 text-sm">{l.desc}</span>
                  </div>
                  {level === l.value && <span className="text-indigo-500 text-lg">✓</span>}
                </button>
              ))}
            </div>
            <button
              className="btn-primary w-full"
              onClick={handleLevelNext}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        )}

        {/* Step 2 — First word */}
        {step === 2 && (
          <div className="card space-y-6 animate-qaw-fade-in-up">
            <div className="text-center">
              <p className="text-4xl mb-3">📖</p>
              <h1 className="text-2xl font-bold text-slate-900">Add your first word</h1>
              <p className="text-slate-500 mt-2">Start building your vocabulary. You can skip this.</p>
            </div>
            <div className="space-y-3">
              <input
                className="input-primary"
                placeholder="German word (e.g. der Hund)"
                value={term}
                autoFocus
                onChange={(e) => setTerm(e.target.value)}
              />
              <input
                className="input-primary"
                placeholder="Meaning (e.g. the dog)"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleWordNext()}
              />
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep(3)}>
                Skip
              </button>
              <button
                className="btn-primary flex-1"
                onClick={handleWordNext}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Add Word →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="card space-y-6 text-center animate-qaw-fade-in-up">
            <p className="text-6xl">🎉</p>
            <h1 className="text-2xl font-bold text-slate-900">You're all set!</h1>
            <p className="text-slate-500">
              Your Deutschly profile is ready. Start sharing your German learning journey and discover others.
            </p>
            <div className="bg-indigo-50 rounded-xl p-4 text-left space-y-2">
              <p className="text-sm font-semibold text-indigo-700">What you can do:</p>
              <p className="text-sm text-slate-600">📝 Share posts about your learning journey</p>
              <p className="text-sm text-slate-600">📖 Build your vocabulary in Words</p>
              <p className="text-sm text-slate-600">🌍 Follow other German learners</p>
            </div>
            <button
              className="btn-primary w-full text-lg py-4"
              onClick={handleDone}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Go to my Feed →'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
