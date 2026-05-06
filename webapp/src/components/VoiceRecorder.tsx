import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { transcribeVoice } from '../hooks/useApi'

type VoiceRecorderProps = {
  onTranscriptionComplete: (text: string) => void
  disabled?: boolean
  language?: string
  existingText?: string
}

export default function VoiceRecorder({ onTranscriptionComplete, disabled = false, language = 'de', existingText }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setIsProcessing(true)
        try {
          const result = await transcribeVoice(audioBlob, language)
          if (result.text) {
            onTranscriptionComplete(result.text)
          } else {
            setError('Could not understand speech. Try again.')
          }
        } catch (err) {
          console.error('Transcription failed:', err)
          setError('Voice service unavailable. Please type your answer.')
        } finally {
          setIsProcessing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      setError('Microphone access denied. Please allow microphone access.')
    }
  }, [language, onTranscriptionComplete])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <span>{error}</span>
        <button onClick={() => setError(null)} className="text-indigo-500 hover:underline">Dismiss</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          disabled={disabled}
        >
          <Square size={16} />
          <span className="text-sm font-medium">Stop</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors disabled:opacity-50"
          disabled={disabled || isProcessing}
        >
          <Mic size={16} />
          <span className="text-sm font-medium">{isProcessing ? 'Processing...' : 'Speak'}</span>
        </button>
      )}
      {isProcessing && <Loader2 size={16} className="animate-spin text-slate-400" />}
      {isRecording && (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-500 font-medium">Recording...</span>
        </div>
      )}
    </div>
  )
}
