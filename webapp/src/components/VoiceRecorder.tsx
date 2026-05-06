import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { transcribeVoice } from '../hooks/useApi'

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

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
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        setIsProcessing(true)
        try {
          const webmBlob = new Blob(audioChunksRef.current, { type: mimeType })
          const audioCtx = new AudioContext()
          const arrayBuffer = await webmBlob.arrayBuffer()
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
          const wavBlob = encodeWav(audioBuffer.getChannelData(0), audioBuffer.sampleRate)
          const result = await transcribeVoice(wavBlob, language)
          if (result.text) {
            onTranscriptionComplete(result.text)
          } else {
            setError('Could not understand speech. Try again.')
          }
        } catch (err: any) {
          console.error('Transcription failed:', err)
          if (err?.response?.status === 503) {
            setError('Voice transcription is not available right now. Type your answer instead.')
          } else {
            setError('Transcription failed. Please try again or type your answer.')
          }
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
