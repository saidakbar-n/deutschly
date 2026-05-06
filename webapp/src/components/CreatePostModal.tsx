import { useEffect, useState } from 'react'
import { createPost, PostPayload, uploadPostImage, listWords } from '../hooks/useApi'
import { Image, X, Type, Tag, Send, BookOpen, ChevronDown } from 'lucide-react'

type Word = {
  id: number
  term: string
  meaning: string
  note?: string
  is_singular?: boolean
}

export function CreatePostModal({ userId, onCreated }: { userId: number; onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [type, setType] = useState<PostPayload['type']>('story')
  const [level, setLevel] = useState('A1')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [words, setWords] = useState<Word[]>([])
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null)
  const [wordDropdownOpen, setWordDropdownOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    listWords(userId, 100).then((data) => setWords(data || [])).catch(() => setWords([]))
  }, [open, userId])

  const submit = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      let finalImageUrl = ''
      if (imageFile) {
        const { url } = await uploadPostImage(userId, imageFile)
        finalImageUrl = url
      }
      await createPost({
        user_id: userId,
        type,
        text,
        level_tag: level,
        image_url: finalImageUrl || undefined,
        word_id: selectedWordId || undefined,
      })
      setOpen(false)
      setText('')
      setImageFile(null)
      setPreviewUrl('')
      setLevel('A1')
      setType('story')
      setSelectedWordId(null)
      setWordDropdownOpen(false)
      onCreated?.()
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button 
        className="btn-primary w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3"
        onClick={() => setOpen(true)}
      >
        <Image size={16} className="sm:size-[18]" />
        <span className="text-sm sm:text-base">Create Post</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-20 sm:pt-24 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-300 w-full max-w-md sm:max-w-lg md:max-w-2xl p-4 sm:p-6 animate-qaw-fade-in-up max-h-[90vh] overflow-y-auto" style={{ animationDelay: '0.1s' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 pt-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gradient-indigo">New Post</h2>
          <button 
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700"
            onClick={() => {
              setOpen(false)
              setText('')
              setImageFile(null)
              setPreviewUrl('')
              setLevel('A1')
              setType('story')
              setSelectedWordId(null)
              setWordDropdownOpen(false)
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Text Area */}
        <div className="mb-4 sm:mb-6">
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-slate-900 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      min-h-[140px] sm:min-h-[180px] resize-y transition-all text-sm sm:text-base"
            maxLength={280}
            placeholder="Share your German learning journey..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-right text-xs text-slate-400 mt-1">{280 - text.length} characters left</p>
        </div>

        {/* Image Upload */}
        <div className="mb-4 sm:mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Image size={18} className="text-indigo-500" />
            Add Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              setImageFile(file)
              if (file) {
                setPreviewUrl(URL.createObjectURL(file))
              } else {
                setPreviewUrl('')
              }
            }}
            className="block w-full text-sm text-slate-500
                      file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4
                      file:rounded-xl file:border-0
                      file:text-xs sm:file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100 cursor-pointer"
          />
          {previewUrl && (
            <div className="relative mt-3">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-40 sm:max-h-48 object-cover rounded-xl border border-slate-200"
              />
              <button
                className="absolute top-1.5 right-1.5 p-1.5 sm:p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                onClick={() => { setImageFile(null); setPreviewUrl('') }}
              >
                <X size={14} className="sm:size-[16]" />
              </button>
            </div>
          )}
        </div>

        {/* Post Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 ml-1 flex items-center gap-1.5">
              <Type size={16} className="text-indigo-500" />
              Post Type
            </label>
            <select
              className="input-primary text-sm sm:text-base"
              value={type}
              onChange={(e) => setType(e.target.value as PostPayload['type'])}
            >
              <option value="story">Story</option>
              <option value="achievement">Achievement</option>
              <option value="tip">Tip</option>
              <option value="question">Question</option>
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 ml-1 flex items-center gap-1.5">
              <Tag size={16} className="text-indigo-500" />
              Language Level
            </label>
            <select
              className="input-primary text-sm sm:text-base"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {['A1', 'A2', 'B1', 'B2', 'C1'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Attach a Word */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-slate-700 ml-1 flex items-center gap-1.5 mb-1.5">
            <BookOpen size={16} className="text-indigo-500" />
            Attach a Word (optional)
          </label>
          <div className="relative">
            <button
              className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 text-left hover:border-indigo-300 transition-colors"
              onClick={() => setWordDropdownOpen(!wordDropdownOpen)}
            >
              <span className="text-sm text-slate-700">
                {selectedWordId
                  ? words.find(w => w.id === selectedWordId)?.term || 'Selected word'
                  : 'Pick one of your words…'}
              </span>
              <ChevronDown size={16} className="text-slate-400 shrink-0" />
            </button>
            {wordDropdownOpen && words.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-qaw-fade-in-up max-h-48 overflow-y-auto">
                {words.map((w) => (
                  <button
                    key={w.id}
                    className="w-full flex flex-col items-start px-4 py-2 text-sm hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0"
                    onClick={() => { setSelectedWordId(w.id); setWordDropdownOpen(false) }}
                  >
                    <span className="font-medium text-slate-900">{w.term}</span>
                    <span className="text-xs text-slate-500">{w.meaning}</span>
                  </button>
                ))}
              </div>
            )}
            {wordDropdownOpen && words.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center">
                <p className="text-sm text-slate-500">No words yet. Add some on the Words tab first!</p>
              </div>
            )}
          </div>
          {selectedWordId && (
            <button
              className="text-xs text-indigo-500 hover:text-indigo-700 mt-1.5 ml-1 font-medium"
              onClick={() => setSelectedWordId(null)}
            >
              Remove attached word
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-4">
          <button
            className="flex-1 btn-secondary flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
            onClick={() => {
              setOpen(false)
              setText('')
              setImageFile(null)
              setPreviewUrl('')
              setLevel('A1')
              setType('story')
              setSelectedWordId(null)
              setWordDropdownOpen(false)
            }}
            disabled={loading}
          >
            <X size={16} className="sm:size-[18]" />
            Cancel
          </button>
          <button
            className="flex-1 btn-primary flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
            onClick={submit}
            disabled={loading || !text.trim()}
          >
            {loading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-qaw-spin" />
            ) : (
              <>
                <Send size={16} className="sm:size-[18]" />
                Post Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
