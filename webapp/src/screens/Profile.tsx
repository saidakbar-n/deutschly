import { useState, useEffect, useCallback } from 'react'
import { User, updateUser, listUserPosts, deletePost, listFollowers, listFollowing, followUser, getUser, listWords } from '../hooks/useApi'
import { PostCard } from '../components/PostCard'
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader'
import { FollowersFollowingModal } from '../components/FollowersFollowingModal'
import type { TabType } from '../components/FollowersFollowingModal'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface ProfileProps {
  user?: User
  userId?: number
  currentUser?: User
  onUpdated?: (user: User) => void
  onBack?: () => void
}

export function Profile({ user: initialUser, userId, currentUser, onUpdated, onBack }: ProfileProps) {
  const [status, setStatus] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<TabType>('followers')
  const [user, setUser] = useState<User | null>(initialUser || null)
  const [userLoading, setUserLoading] = useState(false)
  const [userWords, setUserWords] = useState<any[]>([])
  const [wordsLoading, setWordsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'words'>('posts')

  const [form, setForm] = useState({
    username: '',
    city: '',
    level: 'A1' as User['level'],
    full_name: '',
    about: '',
    age: '',
  })

  // Determine if we're viewing our own profile
  const isOwnProfile = !userId || (currentUser && user && user.id === currentUser.id)

  // Load user data if userId is provided
  const loadUser = useCallback(async () => {
    if (userId && !initialUser) {
      setUserLoading(true)
      try {
        const fetchedUser = await getUser(userId)
        setUser(fetchedUser)
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setUserLoading(false)
      }
    }
  }, [userId, initialUser])

  const loadPosts = useCallback(async () => {
    if (!user) return
    setPostsLoading(true)
    try {
      const data = await listUserPosts(user.id)
      setPosts(data || [])
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setPostsLoading(false)
    }
  }, [user])

  const loadWords = useCallback(async () => {
    if (!user) return
    setWordsLoading(true)
    try {
      const data = await listWords(user.id, 50)
      setUserWords(data || [])
    } catch (error) {
      console.error('Failed to load words:', error)
    } finally {
      setWordsLoading(false)
    }
  }, [user])

  const loadFollowers = useCallback(async () => {
    if (!user) return
    setFollowersLoading(true)
    try {
      const data = await listFollowers(user.id)
      setFollowers(data.followers || [])
    } catch (error) {
      console.error('Failed to load followers:', error)
    } finally {
      setFollowersLoading(false)
    }
  }, [user])

  const loadFollowing = useCallback(async () => {
    if (!user) return
    setFollowingLoading(true)
    try {
      const data = await listFollowing(user.id)
      setFollowing(data.following || [])
    } catch (error) {
      console.error('Failed to load following:', error)
    } finally {
      setFollowingLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        city: user.city || '',
        level: user.level,
        full_name: user.full_name || '',
        about: user.about || '',
        age: user.age ? String(user.age) : '',
      })
      loadPosts()
      loadFollowers()
      loadFollowing()
    }
  }, [user, loadPosts, loadFollowers, loadFollowing])

  useEffect(() => {
    if (user && activeTab === 'words') {
      loadWords()
    }
  }, [user, activeTab, loadWords])

  const save = async () => {
    if (!user) return
    setStatus('Saving...')
    const payload = { ...form, age: form.age ? Number(form.age) : undefined }
    const updated = await updateUser(user.id, payload)
    onUpdated?.(updated)
    setUser(updated)
    setEditMode(false)
    setStatus('Saved')
    setTimeout(() => setStatus(''), 1500)
  }

  const handlePhotoUpload = (url: string) => {
    if (!user) return
    const updated = { ...user, profile_photo: url }
    onUpdated?.(updated)
    setUser(updated)
  }

  const handlePhotoDelete = () => {
    if (!user) return
    const updated = { ...user, profile_photo: undefined }
    onUpdated?.(updated)
    setUser(updated)
  }

  const handleFollow = async (targetUserId: number) => {
    if (!currentUser) return
    try {
      await followUser(targetUserId, currentUser.id)
      await loadFollowers()
      await loadFollowing()
      // Update the user's follower count
      if (user) {
        const isNowFollowing = following.some(f => f.id === targetUserId)
        if (isNowFollowing) {
          setUser({ ...user, followers_count: (user.followers_count || 0) + 1 })
        }
      }
      if (targetUserId === user?.id) {
        onUpdated?.({ ...user })
      }
    } catch (error) {
      console.error('Failed to follow user:', error)
    }
  }

  const openFollowersModal = (tab: TabType) => {
    setModalTab(tab)
    setModalOpen(true)
  }

  if (userLoading) {
    return (
      <div className="card p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <p className="text-slate-500 mt-4">Loading profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500">User not found</p>
        {onBack && <button className="btn-primary mt-4" onClick={onBack}>Back to Search</button>}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-qaw-fade-in-up">
      {/* Back Button (for viewing other users) */}
      {onBack && (
        <button
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Search
        </button>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center md:items-start gap-4">
            {isOwnProfile ? (
              <ProfilePhotoUploader
                userId={user.id}
                currentPhoto={user.profile_photo || null}
                onUploadComplete={handlePhotoUpload}
                onDeleteComplete={handlePhotoDelete}
                size="lg"
                disabled={!editMode}
              />
            ) : (
              user.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user.username}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center ring-4 ring-white shadow-lg">
                  <span className="text-indigo-600 font-bold text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )
            )}
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-900">{user.username}</h1>
              <p className="text-sm text-slate-500 capitalize">{user.full_name}</p>
              {user.age && <p className="text-sm text-slate-500">{user.age} years old</p>}
            </div>
          </div>

          {/* User Info Section */}
          <div className="md:col-span-2 space-y-4">
            {editMode ? (
              <>
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

                {/* Save & Cancel Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200
                              transition-all"
                    onClick={() => {
                      setEditMode(false)
                      setForm({
                        username: user.username,
                        city: user.city || '',
                        level: user.level,
                        full_name: user.full_name || '',
                        about: user.about || '',
                        age: user.age ? String(user.age) : '',
                      })
                    }}
                  >
                    Cancel
                  </button>
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
              </>
            ) : (
              <>
                {/* Display Mode - Show user info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">Full Name</p>
                      <p className="text-slate-900">{user.full_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">Username</p>
                      <p className="text-slate-900">{user.username}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">Age</p>
                      <p className="text-slate-900">{user.age || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">City</p>
                      <p className="text-slate-900">{user.city || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">German Level</p>
                      <p className="text-slate-900">
                        <span className={`level-badge level-${user.level.toLowerCase()}`}>{user.level}</span>
                      </p>
                    </div>
                  </div>

                  {/* About Section */}
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">About You</p>
                    <p className="text-slate-900">{user.about || 'No description yet.'}</p>
                  </div>

                  {/* Edit Button - Only for own profile */}
                  {isOwnProfile && (
                    <div className="flex justify-end pt-2">
                      <button
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold
                                  rounded-xl hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-200
                                  transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300"
                        onClick={() => setEditMode(true)}
                      >
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Follower and Following Stats Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        <div className="flex items-center justify-center gap-8 mb-6">
          <button
            className="text-center hover:bg-slate-50 rounded-xl p-2 transition-colors"
            onClick={() => openFollowersModal('followers')}
          >
            <p className="text-2xl font-bold text-indigo-700">{user.followers_count || 0}</p>
            <p className="text-sm text-slate-600 font-medium">Followers</p>
          </button>
          <div className="w-px h-12 bg-slate-200" />
          <button
            className="text-center hover:bg-slate-50 rounded-xl p-2 transition-colors"
            onClick={() => openFollowersModal('following')}
          >
            <p className="text-2xl font-bold text-indigo-700">{user.following_count || 0}</p>
            <p className="text-sm text-slate-600 font-medium">Following</p>
          </button>
        </div>
      </div>

      {/* Content Tabs (Posts / Words) */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8">
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            className={`px-6 py-3 font-semibold text-sm transition-all ${
              activeTab === 'posts'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            Posts ({user.posts_count || 0})
          </button>
          <button
            className={`px-6 py-3 font-semibold text-sm transition-all ${
              activeTab === 'words'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab('words')}
          >
            Words ({user.words_count || 0})
          </button>
        </div>

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isOwnProfile ? 'My Posts' : `${user.username}'s Posts`}
              </h2>
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
                  currentUserId={currentUser?.id || user.id}
                  onDelete={isOwnProfile ? async () => {
                    const ok = window.confirm('Delete this post?')
                    if (!ok) return
                    await deletePost(p.id, user.id)
                    setPosts((prev) => prev.filter((x) => x.id !== p.id))
                  } : undefined}
                />
              ))}
              {posts.length === 0 && !postsLoading && (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-lg">No posts yet.</p>
                  <p className="text-slate-500 text-sm mt-2">
                    {isOwnProfile ? 'Start sharing your learning journey!' : `${user.username} hasn't shared any posts yet.`}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Words Tab */}
        {activeTab === 'words' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isOwnProfile ? 'My Words' : `${user.username}'s Words`}
              </h2>
              {wordsLoading && <span className="text-sm text-slate-500">Loading...</span>}
            </div>

            <div className="space-y-3">
              {userWords.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-lg">{w.term}</p>
                    <p className="text-slate-600 text-sm mt-1">{w.meaning}</p>
                    {w.note && <p className="text-slate-500 text-xs mt-1 italic">{w.note}</p>}
                  </div>
                  <div className="flex gap-2">
                    {w.is_singular !== undefined && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        w.is_singular ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {w.is_singular ? 'Singular' : 'Plural'}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(w.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {userWords.length === 0 && !wordsLoading && (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-lg">No words yet.</p>
                  <p className="text-slate-500 text-sm mt-2">
                    {isOwnProfile ? 'Start adding words to your collection!' : `${user.username} hasn't added any words yet.`}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Followers/Following Modal */}
      <FollowersFollowingModal
        user={user}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
        followers={followers}
        following={following}
        followersLoading={followersLoading}
        followingLoading={followingLoading}
        onFollow={handleFollow}
      />
    </div>
  )
}
