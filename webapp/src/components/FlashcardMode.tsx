import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, Brain, RotateCcw, Sparkles, ThumbsDown, ThumbsUp, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { getDueFlashcards, submitFlashcardReview, setupFolderFlashcards, getFlashcardStats, type DueCard, type User } from '../hooks/useApi'
import { getArticleColor, getWordArticleInfo } from '../utils/wordHelpers'

export default function FlashcardMode({ user, folderId, folderName, onExit, onComplete }: {
  user: User
  folderId?: number
  folderName?: string
  onExit: () => void
  onComplete: () => void
}) {
  const [cards, setCards] = useState<DueCard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setupLoading, setSetupLoading] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [stats, setStats] = useState({ reviewed: 0, total: 0 })

  const loadCards = useCallback(async () => {
    setLoading(true)
    try {
      let data = await getDueFlashcards(user.id, folderId, 30)
      if (data.length === 0 && folderId) {
        setSetupLoading(true)
        await setupFolderFlashcards(user.id, folderId)
        data = await getDueFlashcards(user.id, folderId, 30)
        setSetupLoading(false)
      }
      setCards(data)
      if (data.length === 0) setDone(true)
    } catch {
      setDone(true)
    } finally {
      setLoading(false)
    }
  }, [user.id, folderId])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  const submitAllRatings = async (finalRatings: Record<number, number>) => {
    setSubmitting(true)
    const entries = Object.entries(finalRatings)
    for (const [wordIdStr, rating] of entries) {
      const wordId = Number(wordIdStr)
      const card = cards.find(c => c.word_id === wordId)
      if (!card) continue
      try {
        await submitFlashcardReview(card.review.id, user.id, rating)
      } catch {}
    }
    try {
      const s = await getFlashcardStats(user.id)
      setStats({ reviewed: entries.length, total: s.total })
    } catch {
      setStats(prev => ({ ...prev, reviewed: entries.length }))
    }
    setSubmitting(false)
    setDone(true)
  }

  const handleRate = (rating: number) => {
    const card = cards[reviewIndex]
    if (!card) return
    const newRatings = { ...ratings, [card.word_id]: rating }
    setRatings(newRatings)
    const next = reviewIndex + 1
    if (next >= cards.length) {
      submitAllRatings(newRatings)
    } else {
      setReviewIndex(next)
    }
  }

  const startReview = () => {
    setReviewing(true)
    setReviewIndex(0)
    setFlipped(false)
  }

  if (loading || setupLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="loading-spinner mb-4" />
        <p className="text-slate-500">{setupLoading ? 'Setting up flashcards...' : 'Loading flashcards...'}</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-5">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
          <Brain size={32} className="text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Session Complete!</h2>
        <p className="text-slate-500 text-center max-w-xs">
          {stats.reviewed > 0
            ? `You reviewed ${stats.reviewed} card${stats.reviewed !== 1 ? 's' : ''}`
            : cards.length === 0
              ? 'No cards due for review right now!'
              : 'All cards reviewed!'}
        </p>
        {stats.total > 0 && (
          <p className="text-xs text-slate-400">{stats.total} total cards in review</p>
        )}
        <div className="flex gap-3">
          <button className="btn-primary flex items-center gap-2" onClick={onExit}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={() => { setDone(false); setIndex(0); setFlipped(false); setReviewing(false); setReviewIndex(0); setRatings({}); setStats({ reviewed: 0, total: 0 }) }}>
            <RotateCcw size={16} /> Study Again
          </button>
        </div>
      </div>
    )
  }

  if (cards.length === 0) return null

  // ── Review mode ──────────────────────────────────────────────
  if (reviewing) {
    const card = cards[reviewIndex]
    if (!card) return null
    const { article, color } = getWordArticleInfo(card.term, card.is_singular !== false)
    const wordOnly = card.term.split(' ').slice(1).join(' ')

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm" onClick={onExit}>
            <ArrowLeft size={16} /> Exit
          </button>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {folderName && <span className="text-indigo-500 font-medium">{folderName}</span>}
            <span>Review {reviewIndex + 1} / {cards.length}</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${(reviewIndex / cards.length) * 100}%` }} />
        </div>

        <div className="card min-h-[200px] flex flex-col items-center justify-center text-center py-8 space-y-4">
          <p className="text-3xl font-bold text-slate-900">
            {article ? (
              <>
                <span className={`inline-block px-3 py-1.5 rounded-xl text-xl font-bold border ${color}`}>{article}</span>
                <span className="ml-2">{wordOnly}</span>
              </>
            ) : (
              <span className="inline-block px-2 py-1 rounded-lg text-xs font-bold border bg-yellow-100 text-yellow-800 border-yellow-200">{card.term}</span>
            )}
          </p>
          <p className="text-xl font-semibold text-indigo-700">{card.meaning}</p>
          {card.note && <p className="text-sm text-slate-500 max-w-md whitespace-pre-wrap">{card.note}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-400 text-center font-medium">How well did you know it?</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              className="py-3 px-2 rounded-2xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors border border-red-100 text-sm flex flex-col items-center gap-1"
              onClick={() => handleRate(0)}
            >
              <ThumbsDown size={16} />
              <span>Again</span>
            </button>
            <button
              className="py-3 px-2 rounded-2xl bg-orange-50 text-orange-600 font-semibold hover:bg-orange-100 transition-colors border border-orange-100 text-sm flex flex-col items-center gap-1"
              onClick={() => handleRate(1)}
            >
              <Sparkles size={16} />
              <span>Hard</span>
            </button>
            <button
              className="py-3 px-2 rounded-2xl bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-colors border border-green-100 text-sm flex flex-col items-center gap-1"
              onClick={() => handleRate(2)}
            >
              <ThumbsUp size={16} />
              <span>Good</span>
            </button>
            <button
              className="py-3 px-2 rounded-2xl bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100 text-sm flex flex-col items-center gap-1"
              onClick={() => handleRate(3)}
            >
              <Brain size={16} />
              <span>Easy</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Browse mode ──────────────────────────────────────────────
  const card = cards[index]
  if (!card) return null
  const { article, color } = getWordArticleInfo(card.term, card.is_singular !== false)
  const wordOnly = card.term.split(' ').slice(1).join(' ')
  const isLastCard = index === cards.length - 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm" onClick={onExit}>
          <ArrowLeft size={16} /> Exit
        </button>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {folderName && <span className="text-indigo-500 font-medium">{folderName}</span>}
          <span>{index + 1} / {cards.length}</span>
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${(index / cards.length) * 100}%` }} />
      </div>

      <div
        className="card relative cursor-pointer select-none"
        style={{ perspective: '1000px', minHeight: '220px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="w-full"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front - term */}
          <div
            className="flex flex-col items-center justify-center text-center py-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="space-y-4 px-4">
              <p className="text-3xl font-bold text-slate-900">
                {article ? (
                  <>
                    <span className={`inline-block px-3 py-1.5 rounded-xl text-xl font-bold border ${color}`}>{article}</span>
                    <span className="ml-2">{wordOnly}</span>
                  </>
                ) : (
                  <span className="inline-block px-2 py-1 rounded-lg text-xs font-bold border bg-yellow-100 text-yellow-800 border-yellow-200">{card.term}</span>
                )}
              </p>
              <p className="text-sm text-indigo-400 font-medium">Tap to reveal</p>
            </div>
          </div>
          {/* Back - meaning */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center py-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="space-y-3 px-4">
              <p className="text-2xl font-semibold text-indigo-700">{card.meaning}</p>
              {card.note && <p className="text-sm text-slate-500 max-w-md">{card.note}</p>}
              <p className="text-sm text-slate-400 font-medium pt-2">Tap to go back</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            index === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          disabled={index === 0}
          onClick={() => { setIndex(i => i - 1); setFlipped(false) }}
        >
          <ChevronLeft size={18} /> Back
        </button>

        {isLastCard ? (
          <button
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
            onClick={startReview}
          >
            <Check size={18} /> Start Review
          </button>
        ) : (
          <button
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => { setIndex(i => i + 1); setFlipped(false) }}
          >
            Next <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
