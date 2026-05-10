import { useState, useRef } from 'react'
import { translateText, createWord, type User } from '../hooks/useApi'
import { ArrowLeftRight, Plus, Check, Loader2, Volume2 } from 'lucide-react'

const LANGUAGES = [
  { code: 'de', label: 'German' },
  { code: 'en', label: 'English' },
  { code: 'uz', label: 'Uzbek' },
  { code: 'ru', label: 'Russian' },
  { code: 'tr', label: 'Turkish' },
]

interface TranslateScreenProps {
  user: User
  onUserUpdated?: () => void
}

export default function TranslateScreen({ user, onUserUpdated }: TranslateScreenProps) {
  const [inputText, setInputText] = useState('')
  const [sourceLang, setSourceLang] = useState('de')
  const [targetLang, setTargetLang] = useState('en')
  const [result, setResult] = useState<{
    translated: string
    alternatives: string[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedWord, setSavedWord] = useState(false)
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTranslate = async (text = inputText) => {
    if (!text.trim()) { setResult(null); return }
    setLoading(true)
    setError('')
    setSavedWord(false)
    try {
      const data = await translateText(text.trim(), sourceLang, targetLang)
      setResult(data)
    } catch {
      setError('Translation failed. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (value: string) => {
    setInputText(value)
    setSavedWord(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => handleTranslate(value), 700)
    } else {
      setResult(null)
    }
  }

  const swapLanguages = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setInputText(result?.translated || '')
    setResult(null)
    setSavedWord(false)
  }

  const handleSaveWord = async () => {
    if (!result || saving) return
    setSaving(true)
    try {
      const isSourceGerman = sourceLang === 'de'
      const term = isSourceGerman ? inputText.trim() : result.translated
      const meaning = isSourceGerman ? result.translated : inputText.trim()

      await createWord({
        user_id: user.id,
        term,
        meaning,
      })
      setSavedWord(true)
      onUserUpdated?.()
    } catch {
      setSavedWord(true)
    } finally {
      setSaving(false)
    }
  }

  const speakText = (text: string, lang: string) => {
    if (!window.speechSynthesis) return
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = lang === 'de' ? 'de-DE' : lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US'
    window.speechSynthesis.speak(utt)
  }

  const isGermanInvolved = sourceLang === 'de' || targetLang === 'de'

  return (
    <div className="space-y-4 p-3 sm:p-0">
      <h2 className="text-xl font-bold text-slate-900">Translate</h2>

      <div className="flex items-center gap-2">
        <select
          className="flex-1 input-primary text-sm py-2"
          value={sourceLang}
          onChange={(e) => { setSourceLang(e.target.value); setResult(null); setSavedWord(false) }}
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>

        <button
          className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          onClick={swapLanguages}
          title="Swap languages"
        >
          <ArrowLeftRight size={18} />
        </button>

        <select
          className="flex-1 input-primary text-sm py-2"
          value={targetLang}
          onChange={(e) => { setTargetLang(e.target.value); setResult(null); setSavedWord(false) }}
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4">
          <textarea
            className="w-full text-slate-900 text-base resize-none outline-none bg-transparent placeholder-slate-300"
            rows={4}
            placeholder="Type to translate..."
            value={inputText}
            onChange={(e) => handleInput(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
          <span className="text-xs text-slate-400">{inputText.length}/500</span>
          <div className="flex gap-2">
            {inputText && (
              <button
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100"
                onClick={() => { setInputText(''); setResult(null); setSavedWord(false) }}
              >
                Clear
              </button>
            )}
            {sourceLang === 'de' && inputText && (
              <button
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                onClick={() => speakText(inputText, 'de')}
                title="Listen (German)"
              >
                <Volume2 size={15} />
              </button>
            )}
            <button
              className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
              onClick={() => handleTranslate()}
              disabled={loading || !inputText.trim()}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Translate'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-2xl font-bold text-slate-900 leading-snug">
                {result.translated}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {targetLang === 'de' && (
                <button
                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => speakText(result.translated, 'de')}
                  title="Listen"
                >
                  <Volume2 size={16} />
                </button>
              )}
              {isGermanInvolved && (
                <button
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    savedWord
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  onClick={handleSaveWord}
                  disabled={saving || savedWord}
                >
                  {savedWord ? (
                    <><Check size={14} /> Saved</>
                  ) : saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <><Plus size={14} /> Save word</>
                  )}
                </button>
              )}
            </div>
          </div>

          {result.alternatives.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
                Alternatives
              </p>
              <div className="flex flex-wrap gap-2">
                {result.alternatives.map((alt, i) => (
                  <button
                    key={i}
                    className="text-sm bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                    onClick={() => setResult({ ...result, translated: alt })}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(sourceLang === 'de' || targetLang === 'de') && (() => {
            const germanText = sourceLang === 'de' ? inputText : result.translated
            const firstWord = germanText.trim().split(' ')[0].toLowerCase()
            if (['der', 'die', 'das'].includes(firstWord)) {
              const colorMap: Record<string, string> = { der: 'text-blue-600 bg-blue-50', die: 'text-red-600 bg-red-50', das: 'text-green-600 bg-green-50' }
              return (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${colorMap[firstWord]}`}>
                  Article: {firstWord.toUpperCase()}
                </div>
              )
            }
            return null
          })()}
        </div>
      )}

      {!result && !loading && !inputText && (
        <div className="text-center py-10 space-y-2">
          <p className="text-5xl">{sourceLang === 'de' ? '🇩🇪' : '🔤'}</p>
          <p className="text-slate-500 font-medium">Translate any word or phrase</p>
          <p className="text-sm text-slate-400">Type above — German words translate automatically</p>
          <p className="text-xs text-slate-300 mt-3">Powered by MyMemory</p>
        </div>
      )}
    </div>
  )
}
