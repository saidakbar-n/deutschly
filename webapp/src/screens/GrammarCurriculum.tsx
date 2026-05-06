import { useState, useEffect, useCallback } from 'react'
import { fetchGrammarBooks, fetchChapters, fetchChapterExercises, quickStartGrammar, type GrammarBook, type GrammarChapter, type User, type QuickStartResult } from '../hooks/useApi'
import GrammarPracticer from './GrammarPracticer'
import { BookOpen, Lock, CheckCircle, Play, ChevronRight, ArrowLeft, Trophy, Zap } from 'lucide-react'

type View = 'curriculum' | 'practicing'

export default function GrammarCurriculum({ user }: { user: User }) {
  const [view, setView] = useState<View>('curriculum')
  const [books, setBooks] = useState<GrammarBook[]>([])
  const [activeLevel, setActiveLevel] = useState<string>('A1')
  const [chapters, setChapters] = useState<GrammarChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChapter, setActiveChapter] = useState<GrammarChapter | null>(null)
  const [quickStartLoading, setQuickStartLoading] = useState(false)

  const handleQuickStart = async () => {
    setQuickStartLoading(true)
    try {
      const result = await quickStartGrammar(user.id, activeLevel)
      if (result) {
        setActiveChapter({
          id: result.chapter.id,
          book_id: result.book.id,
          number: result.chapter.number,
          title: result.chapter.title,
          topic: result.chapter.topic,
          sort_order: result.chapter.number,
          exercise_count: result.chapter.exercise_count,
          progress: result.progress,
        })
        setView('practicing')
      }
    } catch (error) {
      console.error('Quick start failed:', error)
    } finally {
      setQuickStartLoading(false)
    }
  }

  const loadBooks = useCallback(async () => {
    try {
      const data = await fetchGrammarBooks()
      setBooks(data)
      if (data.length > 0) {
        const userLevel = user.level || 'A1'
        const matchingBook = data.find(b => b.level === userLevel)
        setActiveLevel(matchingBook?.level || data[0].level)
      }
    } catch (error) {
      console.error('Failed to load grammar books:', error)
    }
  }, [user.level])

  const loadChapters = useCallback(async () => {
    setLoading(true)
    try {
      const book = books.find(b => b.level === activeLevel)
      if (!book) return
      const data = await fetchChapters(book.id, user.id)
      setChapters(data)
    } catch (error) {
      console.error('Failed to load chapters:', error)
    } finally {
      setLoading(false)
    }
  }, [activeLevel, books, user.id])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  useEffect(() => {
    if (books.length > 0) {
      loadChapters()
    }
  }, [activeLevel, books, loadChapters])

  const openChapter = async (chapter: GrammarChapter) => {
    if (chapter.progress.status === 'locked') return
    setActiveChapter(chapter)
    setView('practicing')
  }

  const backToCurriculum = () => {
    setView('curriculum')
    setActiveChapter(null)
    loadChapters()
  }

  if (view === 'practicing' && activeChapter) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <button
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
          onClick={backToCurriculum}
        >
          <ArrowLeft size={16} /> Back to Curriculum
        </button>
        <GrammarPracticer user={user} chapterId={activeChapter.id} chapterTitle={activeChapter.title} onExit={backToCurriculum} />
      </div>
    )
  }

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1']

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Grammar Curriculum</h1>
        <p className="text-slate-600 mt-1">Netzwerk Neu — structured learning path</p>
      </div>

      {/* Level Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {levels.map(level => (
          <button
            key={level}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeLevel === level ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveLevel(level)}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Quick Start Button */}
      <button
        className="w-full mb-6 py-4 px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-3 hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
        onClick={handleQuickStart}
        disabled={quickStartLoading}
      >
        {quickStartLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Zap size={20} />
            Start Practice — Level {activeLevel}
          </>
        )}
      </button>

      {/* Active Book Info */}
      {books.filter(b => b.level === activeLevel).map(book => (
        <div key={book.id} className="mb-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BookOpen size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{book.title}</h2>
              <p className="text-sm text-slate-600">{book.chapter_count} chapters</p>
            </div>
          </div>
        </div>
      ))}

      {/* Chapter List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading chapters...</p>
        </div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No chapters available for this level yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter, index) => {
            const { status, exercises_done, exercises_total, score_pct } = chapter.progress
            const pct = exercises_total > 0 ? Math.round((exercises_done / exercises_total) * 100) : 0

            return (
              <button
                key={chapter.id}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  status === 'locked'
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : status === 'completed'
                    ? 'bg-green-50 border-green-200 hover:border-green-300'
                    : status === 'in_progress'
                    ? 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
                onClick={() => openChapter(chapter)}
                disabled={status === 'locked'}
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    status === 'locked' ? 'bg-slate-100 text-slate-400'
                    : status === 'completed' ? 'bg-green-100 text-green-600'
                    : status === 'in_progress' ? 'bg-blue-100 text-blue-600'
                    : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {status === 'locked' && <Lock size={18} />}
                    {status === 'completed' && <CheckCircle size={18} />}
                    {status === 'in_progress' && <Play size={18} />}
                    {status === 'unlocked' && <BookOpen size={18} />}
                  </div>

                  {/* Chapter Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 truncate">
                        Kapitel {chapter.number}
                      </h3>
                      {status !== 'locked' && (
                        <ChevronRight size={18} className="text-slate-400 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 truncate">{chapter.title}</p>
                    {chapter.topic && (
                      <p className="text-xs text-slate-400 mt-0.5">{chapter.topic}</p>
                    )}

                    {/* Progress Bar */}
                    {status !== 'locked' && exercises_total > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>{exercises_done}/{exercises_total} exercises</span>
                          {status === 'completed' && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Trophy size={12} /> {score_pct}% accuracy
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              status === 'completed' ? 'bg-green-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {status === 'locked' && (
                      <p className="text-xs text-slate-400 mt-1">Complete the previous chapter to unlock</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
