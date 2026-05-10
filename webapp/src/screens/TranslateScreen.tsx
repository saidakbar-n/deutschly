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
  const [history, setHistory] = useState<{original: string; translated: string; from: string; to: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('deutschly:translate_history') || '[]') } catch { return [] }
  })
  const [result, setResult] = useState<{
    translated: string
    alternatives: string[]
    article?: string | null
    term_with_article?: string | null
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
      const entry = { original: text.trim(), translated: data.translated, from: sourceLang, to: targetLang }
      setHistory(prev => {
        const updated = [entry, ...prev.filter(h => h.original !== text.trim())].slice(0, 20)
        localStorage.setItem('deutschly:translate_history', JSON.stringify(updated))
        return updated
      })
    } catch {
      setError('Translation failed. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const MAX_CHARS = 500

  const handleInput = (value: string) => {
    if (value.length > MAX_CHARS) return
    setInputText(value)
    setSavedWord(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => handleTranslate(value), 700)
    } else {
      setResult(null)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text')
    const current = inputText.length
    const total = current + pasted.length
    if (total > MAX_CHARS) {
      e.preventDefault()
      const allowed = MAX_CHARS - current
      if (allowed > 0) {
        setInputText(inputText + pasted.slice(0, allowed))
      }
    }
  }

  const isGermanInvolved = sourceLang === 'de' || targetLang === 'de'

  const swapLanguages = () => {
    const nextTarget = sourceLang === targetLang
      ? LANGUAGES.find(l => l.code !== targetLang)?.code || 'en'
      : sourceLang
    setSourceLang(targetLang)
    setTargetLang(nextTarget)
    setInputText(result?.translated || '')
    setResult(null)
    setSavedWord(false)
  }

  function isSingleTerm(text: string): boolean {
    const trimmed = text.trim()
    if (!trimmed) return false
    const words = trimmed.split(/\s+/)
    return words.length >= 1 && words.length <= 2
  }

  function getLocalArticle(word: string): { article: string; isSingular: boolean | undefined } {
    const first = word.toLowerCase().split(' ')[0]
    if (first === 'der') return { article: 'der', isSingular: true }
    if (first === 'die') return { article: 'die', isSingular: true }
    if (first === 'das') return { article: 'das', isSingular: true }
    return { article: '', isSingular: undefined }
  }

  const germanTerm = isGermanInvolved
    ? (sourceLang === 'de' ? inputText.trim() : (result?.translated || '').trim())
    : ''
  const canSaveWord = isGermanInvolved && isSingleTerm(germanTerm)

  const handleSaveWord = async () => {
    if (!result || saving || !canSaveWord) return
    setSaving(true)
    try {
      const isSourceGerman = sourceLang === 'de'
      const term = result.term_with_article || (isSourceGerman ? inputText.trim() : result.translated)
      const meaning = isSourceGerman ? result.translated : inputText.trim()

      const { article } = getLocalArticle(term)
      const isSingular = article ? true : undefined

      await createWord({
        user_id: user.id,
        term,
        meaning,
        ...(isSingular !== undefined && { is_singular: isSingular }),
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

  return (
    <div className="space-y-4 p-3 sm:p-0 animate-qaw-fade-in-up">
      <h2 className="text-xl font-bold text-slate-900">Translate</h2>

      <div className="flex items-center gap-2">
        <select
          className="flex-1 input-primary text-sm py-2"
          value={sourceLang}
          onChange={(e) => {
            const newSource = e.target.value
            setSourceLang(newSource)
            if (newSource === targetLang) {
              const fallback = LANGUAGES.find(l => l.code !== newSource)?.code || 'en'
              setTargetLang(fallback)
            }
            setResult(null)
            setSavedWord(false)
          }}
        >
          {LANGUAGES.filter(l => l.code !== targetLang).map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
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
          onChange={(e) => {
            const newTarget = e.target.value
            setTargetLang(newTarget)
            if (newTarget === sourceLang) {
              const fallback = LANGUAGES.find(l => l.code !== newTarget)?.code || 'de'
              setSourceLang(fallback)
            }
            setResult(null)
            setSavedWord(false)
          }}
        >
          {LANGUAGES.filter(l => l.code !== sourceLang).map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
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
            onPaste={handlePaste}
            autoFocus
            maxLength={MAX_CHARS}
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
                <div className="flex flex-col items-end gap-1">
                  <button
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      savedWord
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : canSaveWord
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={handleSaveWord}
                    disabled={saving || savedWord || !canSaveWord}
                  >
                    {savedWord ? (
                      <><Check size={14} /> Saved</>
                    ) : saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <><Plus size={14} /> Save word</>
                    )}
                  </button>
                  {!canSaveWord && !savedWord && (
                    <p className="text-[10px] text-slate-400 text-right leading-tight">Only single words can be saved</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Article badge for German words */}
          {isGermanInvolved && (() => {
            const germanText = sourceLang === 'de' ? inputText : result.translated
            const { article } = getLocalArticle(germanText)
            if (!article) return null
            const colors: Record<string, string> = {
              der: 'bg-blue-100 text-blue-700 border-blue-200',
              die: 'bg-red-100 text-red-700 border-red-200',
              das: 'bg-green-100 text-green-700 border-green-200',
            }
            return (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-medium">Article:</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${colors[article]}`}>
                  {article}
                </span>
              </div>
            )
          })()}

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
        <div>
          {history.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {history.slice(0, 5).map((h, i) => (
                  <button key={i} className="w-full text-left card py-2.5 px-3 hover:shadow-md transition-all"
                    onClick={() => { setInputText(h.original); setSourceLang(h.from); setTargetLang(h.to); handleTranslate(h.original) }}>
                    <span className="font-medium text-slate-900 text-sm">{h.original}</span>
                    <span className="text-slate-400 mx-2">→</span>
                    <span className="text-indigo-700 text-sm">{h.translated}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <p className="text-5xl">{sourceLang === 'de' ? '🇩🇪' : '🔤'}</p>
              <p className="text-slate-500 font-medium">Translate any word or phrase</p>
              <p className="text-sm text-slate-400">Type above — German words translate automatically</p>
              <p className="text-xs text-slate-300 mt-3">Powered by MyMemory</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
