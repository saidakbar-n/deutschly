import React from 'react'
import VoiceRecorder from '../VoiceRecorder'

type ReverseTranslationExerciseProps = {
  nativeSentence: string
  onAnswerSubmit: (answer: string) => void
  feedback?: React.ReactNode
  loading?: boolean
  exerciseId?: number
}

export default function ReverseTranslationExercise({ nativeSentence, onAnswerSubmit, feedback, loading, exerciseId }: ReverseTranslationExerciseProps) {
  const [answer, setAnswer] = React.useState('')

  const handleSubmit = () => {
    if (answer.trim() && !loading) {
      onAnswerSubmit(answer)
    }
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">Reverse Translation</h3>
      <div className="bg-purple-50 p-4 rounded-lg mb-4">
        <p className="text-gray-800 text-lg">{nativeSentence}</p>
        <p className="text-sm text-gray-600 mt-2">Translate this to German:</p>
      </div>
      <input
        type="text"
        className="input-primary w-full"
        placeholder="Enter German translation..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={loading}
      />
      <div className="flex items-center justify-between mt-4">
        <VoiceRecorder
          onTranscriptionComplete={(text) => setAnswer(text)}
          disabled={loading}
        />
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading || !answer.trim()}
        >
          {loading ? 'Checking...' : 'Submit Answer'}
        </button>
      </div>
      {feedback}
    </div>
  )
}
