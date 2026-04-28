import { useState } from 'react'
import { createPost, PostPayload } from '../hooks/useApi'

export function CreatePostModal({ userId, onCreated }: { userId: number; onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [type, setType] = useState<PostPayload['type']>('story')
  const [level, setLevel] = useState('A1')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const submit = async () => {
    setLoading(true)
    let finalImageUrl = imageUrl
    if (imageFile && !imageUrl) {
      finalImageUrl = await fileToDataUrl(imageFile)
      setImageUrl(finalImageUrl)
    }
    await createPost({
      user_id: userId,
      type,
      text,
      level_tag: level,
      image_url: finalImageUrl,
    })
    setOpen(false)
    setText('')
    setImageFile(null)
    setImageUrl('')
    setLoading(false)
    onCreated?.()
  }

  if (!open) {
    return (
      <button className="btn-primary w-full" onClick={() => setOpen(true)}>
        Create Post
      </button>
    )
  }

  return (
    <div className="card space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">New Post</h3>
        <button className="text-slate-500" onClick={() => setOpen(false)}>Close</button>
      </div>
      <textarea
        className="w-full border rounded-xl p-3" rows={3}
        maxLength={280}
        placeholder="Share your progress..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        {imageFile && <span className="text-xs text-slate-500">{imageFile.name}</span>}
      </div>
      <div className="flex gap-2">
        <select className="border rounded-lg px-3 py-2" value={type} onChange={(e) => setType(e.target.value as PostPayload['type'])}>
          <option value="story">Story</option>
          <option value="achievement">Achievement</option>
          <option value="tip">Tip</option>
        </select>
        <select className="border rounded-lg px-3 py-2" value={level} onChange={(e) => setLevel(e.target.value)}>
          {['A1','A2','B1','B2','C1'].map(l => <option key={l}>{l}</option>)}
        </select>
      </div>
      <button className="btn-primary w-full" onClick={submit} disabled={loading}>{loading ? 'Posting...' : 'Post'}</button>
    </div>
  )
}
