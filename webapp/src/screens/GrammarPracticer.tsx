import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { fetchGrammarExercises, fetchGrammarRules, submitGrammarAnswer, fetchGrammarProgress, fetchMistakeReplayQuiz, generateGrammarExercise, fetchChapterExercises, syncChapterProgress, fetchChapterProgress } from '../hooks/useApi'
import BlurtingExercise from '../components/GrammarExercises/BlurtingExercise'
import ClozeExercise from '../components/GrammarExercises/ClozeExercise'
import ReverseTranslationExercise from '../components/GrammarExercises/ReverseTranslationExercise'
import GrammarFeedback from '../components/GrammarFeedback'
import type { GrammarExercise, GrammarRule, UserGrammarAttempt, User } from '../hooks/useApi'

const CHAPTER_EXERCISE_COUNT = 25

type QuizType = 'regular' | 'mistake-replay'

export default function GrammarPracticer({ user, chapterId, chapterTitle, onExit, onUserUpdated, onChapterCompleted, initialQuizType }: { user: User; chapterId?: number; chapterTitle?: string; onExit?: () => void; onUserUpdated?: () => void; onChapterCompleted?: () => void; initialQuizType?: QuizType }) {
  const [exercises, setExercises] = useState<GrammarExercise[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<UserGrammarAttempt | null>(null)
  const [quizComplete, setQuizComplete] = useState(false)
  const [quizType, setQuizType] = useState<QuizType>(initialQuizType || 'regular')
  const [rules, setRules] = useState<GrammarRule[]>([])
  const [progress, setProgress] = useState<{ rule_id: number; correct_attempts: number; total_attempts: number }[]>([])
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [generating, setGenerating] = useState(false)
  const [readyToAdvance, setReadyToAdvance] = useState(false)
  const [chapterJustCompleted, setChapterJustCompleted] = useState(false)

  const currentIndexRef = useRef(0)
  const exercisesRef = useRef<GrammarExercise[]>([])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    exercisesRef.current = exercises
  }, [exercises])

  useEffect(() => {
    if (user) {
      fetchGrammarProgress(user.id)
        .then(data => setProgress(data))
        .catch(console.error)
    }
  }, [user, quizComplete])

  const loadExercises = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setFeedback(null)
    setQuizComplete(false)
    setChapterJustCompleted(false)
    setCurrentIndex(0)
    setScore({ correct: 0, total: 0 })
    setReadyToAdvance(false)

    try {
      let data: GrammarExercise[]
      if (quizType === 'mistake-replay') {
        data = await fetchMistakeReplayQuiz(user.id)
      } else if (chapterId) {
        data = await fetchChapterExercises(chapterId, user.id, CHAPTER_EXERCISE_COUNT)
      } else {
        data = await fetchGrammarExercises(user.id, { limit: CHAPTER_EXERCISE_COUNT })
      }

      if (data.length === 0 && chapterId && !quizComplete) {
        await syncChapterProgress(chapterId, user.id).catch(console.error)
        const prog = await fetchChapterProgress(chapterId, user.id).catch(() => null)
        if (prog && (prog.exercises_done > 0 || prog.status === 'completed')) {
          setScore({ correct: Math.round((prog.score_pct / 100) * prog.exercises_done), total: prog.exercises_done })
          setLoading(false)
          setQuizComplete(true)
          return
        }
      }

      setExercises(data)
    } catch (error) {
      console.error('Failed to load exercises:', error)
    } finally {
      setLoading(false)
    }
  }, [user, quizType, chapterId])

  useEffect(() => {
    if (user) {
      loadExercises()
      if (!chapterId) {
        fetchGrammarRules().then(setRules).catch(console.error)
      }
    }
  }, [user, loadExercises, chapterId])

  const handleAnswerSubmit = async (userInput: string) => {
    if (!user || exercisesRef.current.length === 0) return
    setLoading(true)

    try {
      const attempt = await submitGrammarAnswer(exercisesRef.current[currentIndexRef.current].id, user.id, userInput)
      setFeedback(attempt)
      setScore(prev => ({
        correct: prev.correct + (attempt.is_correct ? 1 : 0),
        total: prev.total + 1
      }))
      setReadyToAdvance(true)
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    if (readyToAdvance === false && feedback === null) return

    const idx = currentIndexRef.current
    const total = exercisesRef.current.length

    setReadyToAdvance(false)
    setFeedback(null)

    if (idx < total - 1) {
      setCurrentIndex(idx + 1)
    } else {
      await syncAndFinish()
    }
  }

  const syncAndFinish = async () => {
    if (chapterId) {
      await syncChapterProgress(chapterId, user.id).catch(console.error)
      try {
        const prog = await fetchChapterProgress(chapterId, user.id)
        if (prog.status === 'completed') {
          setChapterJustCompleted(true)
          onChapterCompleted?.()
        }
      } catch { /* ignore */ }
    }
    onUserUpdated?.()
    setQuizComplete(true)
  }

  const handleQuit = async () => {
    if (score.total > 0) {
      await syncAndFinish()
    }
    onExit?.()
  }

  const handleGenerate = async () => {
    if (!user || rules.length === 0) return
    setGenerating(true)
    try {
      const types = ['cloze', 'reverse_translation', 'blurting']
      const rule = rules[Math.floor(Math.random() * rules.length)]
      const type = types[Math.floor(Math.random() * types.length)]
      await generateGrammarExercise(rule.id, type)
      await loadExercises()
    } catch (err) {
      console.error('Failed to generate exercise', err)
    } finally {
      setGenerating(false)
    }
  }

  const renderExercise = () => {
    if (exercises.length === 0) return null
    const exercise = exercises[currentIndex]

    const feedbackComponent = feedback ? (
      <GrammarFeedback
        isCorrect={feedback.is_correct}
        correction={feedback.is_correct ? undefined : exercise.expected_answer}
        explanation={feedback.feedback_explanation || undefined}
      />
    ) : undefined

    switch (exercise.type) {
      case 'blurting':
        return (
          <BlurtingExercise
            key={currentIndex}
            scenario={exercise.prompt_text}
            onAnswerSubmit={handleAnswerSubmit}
            feedback={feedbackComponent}
            loading={loading}
          />
        )
      case 'cloze':
        const sentenceWithBlank = exercise.prompt_text.replace('_', '___')
        return (
          <ClozeExercise
            key={currentIndex}
            sentenceWithBlank={sentenceWithBlank}
            infinitiveVerb={exercise.infinitive_verb || undefined}
            onAnswerSubmit={handleAnswerSubmit}
            feedback={feedbackComponent}
            loading={loading}
          />
        )
      case 'reverse_translation':
        return (
          <ReverseTranslationExercise
            key={currentIndex}
            nativeSentence={exercise.native_sentence || exercise.prompt_text}
            onAnswerSubmit={handleAnswerSubmit}
            feedback={feedbackComponent}
            loading={loading}
          />
        )
      default:
        return (
          <div className="card p-6">
            <p className="text-gray-600">Unknown exercise type: {exercise.type}</p>
          </div>
        )
    }
  }

  if (!user) return null

  if (loading && exercises.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-3 sm:p-6 animate-qaw-fade-in-up">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading exercises...</p>
        </div>
      </div>
    )
  }

  if (quizComplete) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
    return (
      <div className="max-w-2xl mx-auto p-3 sm:p-6 animate-qaw-fade-in-up">
        <div className="card p-8 text-center">
          <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <p className="text-4xl font-bold text-indigo-600 mb-2">{score.correct}/{score.total}</p>
          <p className="text-gray-600 mb-6">
            {score.correct === score.total ? 'Perfect session!' : score.correct >= score.total / 2 ? 'Good work!' : 'Keep practicing!'}
          </p>
          <div className="w-full max-w-xs bg-gray-200 rounded-full h-3 mx-auto mb-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          {chapterJustCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
              <p className="text-2xl mb-1">🎉</p>
              <p className="font-bold text-green-700">Chapter Complete!</p>
              <p className="text-sm text-green-600 mt-1">The next chapter is now unlocked</p>
            </div>
          )}
          <button className="btn-primary" onClick={loadExercises}>
            Practice Again
          </button>
          {onExit && (
            <button className="btn-secondary mt-2 mx-auto" onClick={onExit}>
              Back to Curriculum
            </button>
          )}
          {!chapterId && (
            <>
              <button
                className="btn-secondary mt-2 flex items-center gap-2 mx-auto"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate new exercises'}
              </button>
              <p className="text-xs text-slate-400 mt-2">
                Uses AI to create fresh exercises for your level
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6 animate-qaw-fade-in-up">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onExit && (
              <button
                className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                onClick={handleQuit}
                title="Save & quit"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-2xl font-bold">{chapterTitle || 'Grammar Practice'}</h1>
            {!chapterId && (
              <span className={`level-badge level-${user.level.toLowerCase()}`}>
                {user.level}
              </span>
            )}
          </div>
          {!chapterId && (
            <button
              className="text-sm text-red-600 hover:underline"
              onClick={() => {
                setQuizType('mistake-replay')
                loadExercises()
              }}
            >
              Mistake Replay
            </button>
          )}
        </div>
        <p className="text-gray-600 mt-1">
          {quizType === 'mistake-replay' ? 'Reviewing missed patterns' : `Exercise ${currentIndex + 1} of ${exercises.length}`}
          {chapterId ? ' — Chapter exercises' : ' — Exercises matched to your level'}
        </p>
        {quizType !== 'mistake-replay' && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {exercises.length > 0 ? renderExercise() : (
        <div className="card p-8 text-center">
          <p className="text-gray-600 mb-4">No exercises available yet.</p>
          <p className="text-sm text-gray-500">Exercises will be generated based on your level and progress.</p>
        </div>
      )}

      {readyToAdvance && (
        <button
          className="btn-primary w-full mt-6 text-lg py-3"
          onClick={handleNext}
        >
          {currentIndex < exercises.length - 1 ? 'Next Question →' : 'See Results →'}
        </button>
      )}
    </div>
  )
}
