import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from '../hooks/useSession'
import { fetchGrammarExercises, fetchGrammarRules, submitGrammarAnswer, fetchGrammarProgress, fetchMistakeReplayQuiz } from '../hooks/useApi'
import BlurtingExercise from '../components/GrammarExercises/BlurtingExercise'
import ClozeExercise from '../components/GrammarExercises/ClozeExercise'
import ReverseTranslationExercise from '../components/GrammarExercises/ReverseTranslationExercise'
import GrammarFeedback from '../components/GrammarFeedback'
import type { GrammarExercise, GrammarRule, UserGrammarAttempt } from '../hooks/useApi'

type QuizType = 'regular' | 'mistake-replay'

export default function GrammarPracticer() {
  const { user } = useSession()
  const [exercises, setExercises] = useState<GrammarExercise[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<UserGrammarAttempt | null>(null)
  const [quizComplete, setQuizComplete] = useState(false)
  const [quizType, setQuizType] = useState<QuizType>('regular')
  const [rules, setRules] = useState<GrammarRule[]>([])
  const [progress, setProgress] = useState<{ rule_id: number; correct_attempts: number; total_attempts: number }[]>([])

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
    setCurrentIndex(0)

    try {
      let data: GrammarExercise[]
      if (quizType === 'mistake-replay') {
        data = await fetchMistakeReplayQuiz(user.id)
      } else {
        data = await fetchGrammarExercises(user.id, { limit: 5 })
        if (data.length === 0) {
          data = await fetchGrammarExercises(user.id, { limit: 5 })
        }
      }
      setExercises(data)
    } catch (error) {
      console.error('Failed to load exercises:', error)
    } finally {
      setLoading(false)
    }
  }, [user, quizType])

  useEffect(() => {
    if (user) {
      loadExercises()
      fetchGrammarRules().then(setRules).catch(console.error)
    }
  }, [user, loadExercises])

  const handleAnswerSubmit = async (userInput: string) => {
    if (!user || exercises.length === 0) return
    setLoading(true)

    try {
      const attempt = await submitGrammarAnswer(exercises[currentIndex].id, user.id, userInput)
      setFeedback(attempt)

      setTimeout(() => {
        if (currentIndex < exercises.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setFeedback(null)
          setLoading(false)
        } else {
          setQuizComplete(true)
          setLoading(false)
        }
      }, 2000)
    } catch (error) {
      console.error('Failed to submit answer:', error)
      setLoading(false)
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
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading exercises...</p>
        </div>
      </div>
    )
  }

  if (quizComplete) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card p-8 text-center">
          <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <p className="text-gray-600 mb-6">You've completed this grammar practice session.</p>
          <button className="btn-primary" onClick={loadExercises}>
            Practice Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Grammar Practicer</h1>
          <button
            className="text-sm text-red-600 hover:underline"
            onClick={() => {
              setQuizType('mistake-replay')
              loadExercises()
            }}
          >
            Mistake Replay
          </button>
        </div>
        <p className="text-gray-600 mt-1">
          {quizType === 'mistake-replay' ? 'Reviewing missed patterns' : `Exercise ${currentIndex + 1} of ${exercises.length}`}
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
    </div>
  )
}
