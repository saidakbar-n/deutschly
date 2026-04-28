import { useState, useEffect } from 'react'
import { User, updateUser, listUserPosts, deletePost } from '../hooks/useApi'
import { PostCard } from '../components/PostCard'

export function Profile({ user, onUpdated }: { user: User; onUpdated?: (user: User) => void }) {
  const [status, setStatus] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [form, setForm] = useState({
    username: user.username,
    city: user.city || '',
    level: user.level,
    full_name: user.full_name || '',
    about: user.about || '',
    age: user.age || '',
    profile_photo: user.profile_photo || '',
  })

  useEffect(() => {
    setForm({
      username: user.username,
      city: user.city || '',
      level: user.level,
      full_name: user.full_name || '',
      about: user.about || '',
      age: user.age || '',
      profile_photo: user.profile_photo || '',
    })
    loadPosts()
  }, [user])

  const loadPosts = async () => {
    setPostsLoading(true)
    const data = await listUserPosts(user.id)
    setPosts(data || [])
    setPostsLoading(false)
  }

  const save = async () => {
    setStatus('Saving...')
    const payload = { ...form, age: form.age ? Number(form.age) : undefined }
    const updated = await updateUser(user.id, payload)
    onUpdated?.(updated)
    setStatus('Saved')
    setTimeout(() => setStatus(''), 1500)
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Profile</h3>
        <span className="text-xs text-slate-500">{status}</span>
      </div>
      <input
        className="border rounded-lg p-3"
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
      />
      <input
        className="border rounded-lg p-3"
        placeholder="Full name"
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
      />
      <input
        className="border rounded-lg p-3"
        type="number"
        placeholder="Age"
        value={form.age}
        onChange={(e) => setForm({ ...form, age: e.target.value })}
      />
      <input
        className="border rounded-lg p-3"
        placeholder="City"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
      />
      <select
        className="border rounded-lg p-3"
        value={form.level}
        onChange={(e) => setForm({ ...form, level: e.target.value as User['level'] })}
      >
        {['A1', 'A2', 'B1', 'B2', 'C1'].map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>
      <input
        className="border rounded-lg p-3"
        placeholder="Profile photo URL"
        value={form.profile_photo}
        onChange={(e) => setForm({ ...form, profile_photo: e.target.value })}
      />
      <textarea
        className="border rounded-lg p-3"
        placeholder="About you"
        rows={3}
        value={form.about}
        onChange={(e) => setForm({ ...form, about: e.target.value })}
      />
      <button className="btn-primary w-full" onClick={save}>
        Save Profile
      </button>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">My posts</h4>
          {postsLoading && <span className="text-xs text-slate-500">Loading...</span>}
        </div>
        {posts.map((p) => (
          <PostCard
            key={p.id}
            id={p.id}
            author={{ id: p.user_id, username: user.username, level: user.level, city: user.city }}
            text={p.text}
            image_url={p.image_url}
            type={p.type}
            likes={p.likes}
            comments_count={p.comments_count}
            currentUserId={user.id}
            onDelete={async () => {
              const ok = window.confirm('Delete this post?')
              if (!ok) return
              await deletePost(p.id, user.id)
              setPosts((prev) => prev.filter((x) => x.id !== p.id))
            }}
          />
        ))}
        {posts.length === 0 && !postsLoading && <p className="text-sm text-slate-500">No posts yet.</p>}
      </div>
    </div>
  )
}
