import React from 'react'

type ReverseTranslationExerciseProps = {
  nativeSentence: string
  onAnswerSubmit: (answer: string) => void
  feedback?: React.ReactNode
  loading?: boolean
  exerciseId?: number
}

export default function ReverseTranslationExercise({ nativeSentence, onAnswerSubmit, feedback, loading, exerciseId }: ReverseTranslationExerciseProps) {
  const [answer, setAnswer] = React.useState('')
  const [isRecording, setIsRecording] = React.useState(false)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])

  const handleSubmit = () => {
    if (answer.trim() && !loading) {
      onAnswerSubmit(answer)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        // In a real implementation, send audio to backend for STT
        console.log('Audio recorded:', audioBlob)
        // For now, just submit text
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
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
      <div className="flex gap-2 mt-4">
        <button
          className="btn-primary flex-1"
          onClick={handleSubmit}
          disabled={loading || !answer.trim()}
        >
          {loading ? 'Checking...' : 'Submit Answer'}
        </button>
        <button
          className={`px-4 py-2 rounded-lg border-2 transition-colors ${
            isRecording
              ? 'border-red-500 bg-red-50 text-red-600'
              : 'border-gray-300 hover:border-gray-400 text-gray-600'
          }`}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          disabled={loading}
        >
          {isRecording ? '🔴 Recording...' : '🎤 Hold to Speak'}
        </button>
      </div>
      {feedback}
    </div>
  )
}
