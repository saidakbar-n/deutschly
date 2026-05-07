import React from 'react'
import VoiceRecorder from '../VoiceRecorder'

type BlurtingExerciseProps = {
  scenario: string
  onAnswerSubmit: (answer: string) => void
  feedback?: React.ReactNode
  loading?: boolean
}

export default function BlurtingExercise({ scenario, onAnswerSubmit, feedback, loading }: BlurtingExerciseProps) {
  const [answer, setAnswer] = React.useState('')

  const handleSubmit = () => {
    if (answer.trim() && !loading) {
      onAnswerSubmit(answer)
    }
  }

  return (
    <div className="card p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Blurting Exercise</h3>
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-gray-800">{scenario}</p>
      </div>
      <textarea
        className="input-primary w-full h-32 resize-none"
        placeholder="Write your German sentence here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
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
        disabled={loading || !answer.trim()}
      >
        {loading ? 'Checking...' : 'Submit Answer'}
      </button>
      {feedback}
    </div>
  )
}
