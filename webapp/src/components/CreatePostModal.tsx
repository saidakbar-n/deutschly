import { useState } from 'react'
import { createPost, PostPayload, uploadPostImage } from '../hooks/useApi'
import { Image, X, Type, Tag, Send } from 'lucide-react'

export function CreatePostModal({ userId, onCreated }: { userId: number; onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [type, setType] = useState<PostPayload['type']>('story')
  const [level, setLevel] = useState('A1')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

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
      })
      setOpen(false)
      setText('')
      setImageFile(null)
      setLevel('A1')
      setType('story')
      onCreated?.()
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button 
        className="btn-primary w-full flex items-center justify-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Image size={18} />
        Create Post
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-24 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-300 w-full max-w-2xl p-6 animate-qaw-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-2">
          <h2 className="text-2xl font-bold text-gradient-indigo">New Post</h2>
          <button 
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700"
            onClick={() => {
              setOpen(false)
              setText('')
              setImageFile(null)
              setLevel('A1')
              setType('story')
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Text Area */}
        <div className="mb-6">
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      min-h-[180px] resize-y transition-all"
            maxLength={280}
            placeholder="Share your German learning journey..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-right text-xs text-slate-400 mt-1">{280 - text.length} characters left</p>
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Image size={18} className="text-indigo-500" />
            Add Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100 cursor-pointer"
          />
        </div>

        {/* Post Settings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 ml-1 flex items-center gap-1.5">
              <Type size={16} className="text-indigo-500" />
              Post Type
            </label>
            <select
              className="input-primary"
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
              className="input-primary"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {['A1', 'A2', 'B1', 'B2', 'C1'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
            onClick={() => {
              setOpen(false)
              setText('')
              setImageFile(null)
              setLevel('A1')
              setType('story')
            }}
            disabled={loading}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            className="flex-1 btn-primary flex items-center justify-center gap-2"
            onClick={submit}
            disabled={loading || !text.trim()}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-qaw-spin" />
            ) : (
              <>
                <Send size={18} />
                Post Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
