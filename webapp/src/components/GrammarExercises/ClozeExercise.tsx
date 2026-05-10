import React from 'react'
import VoiceRecorder from '../VoiceRecorder'

type ClozeExerciseProps = {
  sentenceWithBlank: string
  infinitiveVerb?: string
  onAnswerSubmit: (answer: string) => void
  feedback?: React.ReactNode
  loading?: boolean
}

export default function ClozeExercise({ sentenceWithBlank, infinitiveVerb, onAnswerSubmit, feedback, loading }: ClozeExerciseProps) {
  const [answer, setAnswer] = React.useState('')

  const handleSubmit = () => {
    if (answer.trim() && !loading) {
      onAnswerSubmit(answer)
    }
  }

  return (
    <div className="card p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Cloze Exercise</h3>
      <div className="bg-green-50 p-4 rounded-lg mb-4">
        <p className="text-gray-800 text-base sm:text-lg">{sentenceWithBlank}</p>
        {infinitiveVerb && (
          <p className="text-sm text-gray-600 mt-2">Hint: verb is "{infinitiveVerb}"</p>
        )}
      </div>
      <input
        type="text"
        className="input-primary w-full"
        placeholder="Fill in the blank..."
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
      </div>
      <button
        className="btn-primary mt-4 w-full"
        onClick={handleSubmit}
        disabled={loading || !answer.trim() || !!feedback}
      >
        {loading ? 'Checking...' : 'Submit Answer'}
      </button>
      {feedback}
    </div>
  )
}
