import { useState, useEffect } from 'react'
import { User, updateUser, listUserPosts, deletePost } from '../hooks/useApi'
import { PostCard } from '../components/PostCard'
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader'

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
  })

  useEffect(() => {
    setForm({
      username: user.username,
      city: user.city || '',
      level: user.level,
      full_name: user.full_name || '',
      about: user.about || '',
      age: user.age || '',
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

  const handlePhotoUpload = (url: string) => {
    onUpdated?.({ ...user, profile_photo: url })
  }

  const handlePhotoDelete = () => {
    onUpdated?.({ ...user, profile_photo: undefined })
  }

  return (
    <div className="space-y-6 animate-qaw-fade-in-up">
      {/* ============================================
          Profile Header - Instagram/LinkedIn Style
      ============================================ */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <ProfilePhotoUploader
              userId={user.id}
              currentPhoto={user.profile_photo || null}
              onUploadComplete={handlePhotoUpload}
              onDeleteComplete={handlePhotoDelete}
              size="lg"
            />
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-900">{user.username}</h1>
              <p className="text-sm text-slate-500 capitalize">{user.full_name}</p>
            </div>
          </div>

          {/* User Info Section */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-900 bg-white
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                            transition-all"
                  placeholder="Enter your full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">
                  Username
                </label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-900 bg-white
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                            transition-all"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">
                  Age
                </label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-900 bg-white
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                            transition-all"
                  type="number"
                  placeholder="Your age"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">
                  City
                </label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-900 bg-white
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                            transition-all"
                  placeholder="Where are you from?"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">
                  German Level
                </label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-900 bg-white
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                            transition-all"
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as User['level'] })}
                >
                  {['A1', 'A2', 'B1', 'B2', 'C1'].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* About Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                About You
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-900 bg-white
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                          transition-all resize-none"
                placeholder="Tell us about yourself..."
                rows={4}
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold
                          rounded-xl hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-200
                          transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300
                          disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={save}
                disabled={status === 'Saving...'}
              >
                {status === 'Saving...' ? 'Saving...' : 'Save Profile'}
              </button>
              {status === 'Saved' && (
                <span className="ml-3 text-green-600 text-sm font-medium">Saved!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          User Posts Section
      ============================================ */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">My Posts</h2>
          {postsLoading && <span className="text-sm text-slate-500">Loading...</span>}
        </div>

        <div className="space-y-4">
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
          {posts.length === 0 && !postsLoading && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No posts yet.</p>
              <p className="text-slate-500 text-sm mt-2">
                Start sharing your learning journey!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
