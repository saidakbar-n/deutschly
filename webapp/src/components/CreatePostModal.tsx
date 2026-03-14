import { useState } from 'react'
import { createPost, PostPayload } from '../hooks/useApi'

export function CreatePostModal({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [type, setType] = useState<PostPayload['type']>('story')
  const [level, setLevel] = useState('A1')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const uploadImage = async (file: File) => {
    // Stub for Cloudinary upload; replace with real preset/URL.
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', 'deutschly')
    // In real use: await fetch('https://api.cloudinary.com/v1_1/<cloud>/image/upload', { method: 'POST', body: form })
    // For now, return a local object URL preview.
    return URL.createObjectURL(file)
  }

  const submit = async () => {
    setLoading(true)
    let finalImageUrl = imageUrl
    if (imageFile && !imageUrl) {
      finalImageUrl = await uploadImage(imageFile)
      setImageUrl(finalImageUrl)
    }
    await createPost({ user_id: userId, type, text, level_tag: level, image_url: finalImageUrl })
    setOpen(false)
    setText('')
    setImageFile(null)
    setImageUrl('')
    setLoading(false)
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
