import { useState, useEffect, useCallback } from 'react'
import { User, updateUser, listUserPosts, deletePost, listFollowers, listFollowing, followUser, unfollowUser, getUser, listWords, listWordsByFolder, listWordFolders, WordFolder, getImageUrl, fetchGrammarProgress, UserGrammarProgressRich } from '../hooks/useApi'
import { PostCard } from '../components/PostCard'
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader'
import { FollowersFollowingModal } from '../components/FollowersFollowingModal'
import { WordCard } from '../components/WordCard'
import type { TabType } from '../components/FollowersFollowingModal'
import { ArrowLeft, Loader2, Folder, FolderOpen } from 'lucide-react'

interface ProfileProps {
  user?: User
  userId?: number
  currentUser?: User
  onUpdated?: (user: User) => void
  onBack?: () => void
  onNavigate?: (screen: string) => void
  onViewUser?: (userId: number) => void
}

export function Profile({ user: initialUser, userId, currentUser, onUpdated, onBack, onNavigate, onViewUser }: ProfileProps) {
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
  const [wordsByFolder, setWordsByFolder] = useState<{ uncategorized: any[]; folders: Record<number, { folder: WordFolder; words: any[] }> } | null>(null)
  const [wordsLoading, setWordsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'words' | 'grammar'>('posts')
  const [folders, setFolders] = useState<WordFolder[]>([])
  const [grammarProgress, setGrammarProgress] = useState<UserGrammarProgressRich[]>([])
  const [grammarLoading, setGrammarLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

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

  // State to track if currentUser is following the viewed profile
  const [isFollowing, setIsFollowing] = useState(false)

  // Load follow status when viewing another user's profile
  useEffect(() => {
    if (user && currentUser && !isOwnProfile) {
      const checkFollowStatus = async () => {
        try {
          const data = await listFollowing(currentUser.id)
          const followingList = data.following || []
          setIsFollowing(followingList.some((f: User) => f.id === user.id))
        } catch (error) {
          console.error('Failed to check follow status:', error)
        }
      }
      checkFollowStatus()
    } else {
      setIsFollowing(false)
    }
  }, [user, currentUser, isOwnProfile])

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

  const loadWordsByFolder = useCallback(async () => {
    if (!user) return
    setWordsLoading(true)
    try {
      const data = await listWordsByFolder(user.id)
      setWordsByFolder(data)
      
      // Also load folders to get their details
      const foldersData = await listWordFolders(user.id)
      setFolders(foldersData || [])
    } catch (error) {
      console.error('Failed to load words by folder:', error)
    } finally {
      setWordsLoading(false)
    }
  }, [user])

  // Helper function to get folder by ID
  const getFolderById = (folderId: number) => {
    return folders.find(f => f.id === folderId)
  }

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

  const loadGrammarProgress = useCallback(async () => {
    if (!user) return
    setGrammarLoading(true)
    try {
      const data = await fetchGrammarProgress(user.id)
      setGrammarProgress(data)
    } catch (err) {
      console.error('Failed to load grammar progress', err)
    } finally {
      setGrammarLoading(false)
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
      loadWordsByFolder()
    }
  }, [user, activeTab, loadWordsByFolder])

  useEffect(() => {
    if (activeTab === 'grammar') loadGrammarProgress()
  }, [activeTab, loadGrammarProgress])

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
      if (following.some(f => f.id === targetUserId)) {
        await unfollowUser(targetUserId, currentUser.id)
        await loadFollowing()
        if (targetUserId === user?.id) {
          setIsFollowing(false)
        }
      } else {
        await followUser(targetUserId, currentUser.id)
        await loadFollowing()
        if (targetUserId === user?.id) {
          setIsFollowing(true)
        }
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error)
    }
  }

  const handleFollowButton = async () => {
    if (!user || !currentUser) return
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await unfollowUser(user.id, currentUser.id)
        setUser({ ...user, followers_count: Math.max(0, (user.followers_count || 0) - 1) })
        setIsFollowing(false)
      } else {
        await followUser(user.id, currentUser.id)
        setUser({ ...user, followers_count: (user.followers_count || 0) + 1 })
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error)
    } finally {
      setFollowLoading(false)
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
      {/* Back Button (for viewing other users) - Responsive */}
      {onBack && (
        <button
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4 px-2"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Search</span>
        </button>
      )}

      {/* Profile Header - Responsive */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
          {/* Profile Photo */}
          <div className="shrink-0">
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
                  src={getImageUrl(user.profile_photo)}
                  alt={user.username}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center ring-4 ring-white shadow-lg">
                  <span className="text-indigo-600 font-bold text-2xl md:text-3xl">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                    <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Username</label>
                    <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Age</label>
                    <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">City</label>
                    <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">German Level</label>
                    <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as User['level'] })}>
                      {['A1', 'A2', 'B1', 'B2', 'C1'].map((l) => (<option key={l} value={l}>{l}</option>))}
                    </select>
                  </div>
                </div>
                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">About</label>
                  <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none" rows={3} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
                </div>
                <div className="flex justify-center md:justify-end gap-2 pt-1">
                  <button className="px-5 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-all text-sm" onClick={() => { setEditMode(false); setForm({ username: user.username, city: user.city || '', level: user.level, full_name: user.full_name || '', about: user.about || '', age: user.age ? String(user.age) : '' }); }}>Cancel</button>
                  <button className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-200 transition-all text-sm disabled:opacity-50" onClick={save} disabled={status === 'Saving...'}>{status === 'Saving...' ? 'Saving...' : 'Save'}</button>
                  {status === 'Saved' && <span className="ml-2 text-green-600 text-sm font-medium self-center">Saved!</span>}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-left">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Full Name</p>
                    <p className="text-sm text-slate-800 mt-0.5">{user.full_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Username</p>
                    <p className="text-sm text-slate-800 mt-0.5">@{user.username}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Age</p>
                    <p className="text-sm text-slate-800 mt-0.5">{user.age || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">City</p>
                    <p className="text-sm text-slate-800 mt-0.5">{user.city || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Level</p>
                    <p className="mt-0.5"><span className={`level-badge level-${user.level.toLowerCase()}`}>{user.level}</span></p>
                  </div>
                </div>
                {user.about && (
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">About</p>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">{user.about}</p>
                  </div>
                )}
                {isOwnProfile ? (
                  <div className="flex justify-center md:justify-end pt-1">
                    <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-200 transition-all duration-200 text-sm" onClick={() => setEditMode(true)}>Edit Profile</button>
                  </div>
                ) : (
                  <div className="flex justify-center md:justify-end pt-1">
                    <button
                      className={`px-6 py-2 font-semibold rounded-xl shadow-md transition-all duration-200 text-sm ${
                        isFollowing
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 shadow-slate-200'
                          : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200'
                      }`}
                      onClick={handleFollowButton}
                      disabled={followLoading}
                    >
                      {followLoading ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follower and Following Stats Bar - Responsive */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6">
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-4 md:mb-6 flex-wrap">
          <button
            className="text-center hover:bg-slate-50 rounded-xl p-2 md:p-3 transition-colors w-24 md:w-auto"
            onClick={() => openFollowersModal('followers')}
          >
            <p className="text-xl md:text-2xl font-bold text-indigo-700">{user.followers_count || 0}</p>
            <p className="text-xs md:text-sm text-slate-600 font-medium">Followers</p>
          </button>
          <div className="hidden md:block w-px h-10 md:h-12 bg-slate-200" />
          <div className="md:hidden w-full h-px bg-slate-200 my-2" />
          <button
            className="text-center hover:bg-slate-50 rounded-xl p-2 md:p-3 transition-colors w-24 md:w-auto"
            onClick={() => openFollowersModal('following')}
          >
            <p className="text-xl md:text-2xl font-bold text-indigo-700">{user.following_count || 0}</p>
            <p className="text-xs md:text-sm text-slate-600 font-medium">Following</p>
          </button>
        </div>
      </div>

      {/* Content Tabs (Posts / Words) - Responsive */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6 lg:p-8">
        {/* Tab Navigation - Responsive */}
        <div className="flex border-b border-slate-200 mb-4 md:mb-6 overflow-x-auto">
          <button
            className={`px-4 py-2 md:px-6 md:py-3 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'posts'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            Posts ({user.posts_count || 0})
          </button>
          <button
            className={`px-4 py-2 md:px-6 md:py-3 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'words'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab('words')}
          >
            Words ({user.words_count || 0})
          </button>
          {isOwnProfile && (
            <button
              className={`px-4 py-2 md:px-6 md:py-3 font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'grammar'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('grammar')}
            >
              Grammar
            </button>
          )}
          {(user.streak || 0) > 0 && (
            <div className="flex items-center gap-1.5 text-orange-600 font-semibold text-sm px-4 py-2">
              <span>🔥</span>
              <span>{user.streak} day streak</span>
            </div>
          )}
        </div>

        {/* Posts Tab - Responsive Grid */}
        {activeTab === 'posts' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-2">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">
                {isOwnProfile ? 'My Posts' : `${user.username}'s Posts`}
              </h2>
              {postsLoading && <span className="text-sm text-slate-500">Loading...</span>}
            </div>

            {postsLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((p) => (
                  <div key={p.id} className="w-full">
                    <PostCard
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
                  </div>
                ))}
                {posts.length === 0 && !postsLoading && (
                  <div className="sm:col-span-2 lg:col-span-3 text-center py-8 md:py-12">
                    <p className="text-slate-400 text-lg">No posts yet.</p>
                    <p className="text-slate-500 text-sm mt-2">
                      {isOwnProfile ? 'Start sharing your learning journey!' : `${user.username} hasn't shared any posts yet.`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Words Tab - Responsive Grid */}
        {activeTab === 'words' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-2">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">
                {isOwnProfile ? 'My Words' : `${user.username}'s Words`}
              </h2>
              {wordsLoading && <span className="text-sm text-slate-500">Loading...</span>}
            </div>

            {wordsLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : !wordsByFolder ? (
              <div className="text-center py-8 md:py-12">
                <p className="text-slate-400 text-lg">No words yet.</p>
                <p className="text-slate-500 text-sm mt-2">
                  {isOwnProfile ? 'Start adding words to your collection!' : `${user.username} hasn't added any words yet.`}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Uncategorized Folder */}
                {(wordsByFolder.uncategorized?.length || 0) > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <FolderOpen size={18} className="text-slate-400" />
                      <h3 className="font-semibold text-slate-800">Uncategorized</h3>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        {wordsByFolder.uncategorized.length} words
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {wordsByFolder.uncategorized.map((w) => (
                        <WordCard key={w.id} term={w.term} meaning={w.meaning} note={w.note} is_singular={w.is_singular} created_at={w.created_at} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Folders with words */}
                {Object.entries(wordsByFolder.folders || {}).map(([folderId, folderData]) => {
                  const folder = getFolderById(Number(folderId)) || folderData.folder
                  const words = folderData.words
                  
                  if (words.length === 0) return null
                  
                  return (
                    <div key={folderId} className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: folder.color || '#6366f1' }} />
                        <Folder size={18} className="text-slate-400 flex-shrink-0" />
                        <h3 className="font-semibold text-slate-800 truncate">{folder.name}</h3>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                          {words.length} words
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {words.map((w) => (
                          <WordCard key={w.id} term={w.term} meaning={w.meaning} note={w.note} is_singular={w.is_singular} created_at={w.created_at} />
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Empty state */}
                {(wordsByFolder.uncategorized?.length || 0) === 0 && 
                 Object.values(wordsByFolder.folders || {}).every(f => f.words.length === 0) && (
                  <div className="text-center py-8 md:py-12">
                    <p className="text-slate-400 text-lg">No words yet.</p>
                    <p className="text-slate-500 text-sm mt-2">
                      {isOwnProfile ? 'Start adding words to your collection!' : `${user.username} hasn't added any words yet.`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'grammar' && isOwnProfile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">Grammar Progress</h2>
              {grammarLoading && <span className="text-sm text-slate-500">Loading...</span>}
            </div>

            {!grammarLoading && grammarProgress.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <p className="text-4xl">🧠</p>
                <p className="text-slate-600 font-medium">No grammar practice yet</p>
                <p className="text-slate-400 text-sm">
                  Start practicing in the Grammar section to track your progress here
                </p>
                {onNavigate && (
                  <button className="btn-primary mt-2" onClick={() => onNavigate('grammar')}>
                    Start practicing →
                  </button>
                )}
              </div>
            )}

            {grammarProgress.map((p) => {
              const isWeak = p.accuracy < 60
              const isStrong = p.accuracy >= 80

              return (
                <div key={p.id} className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{p.rule_name}</span>
                      {p.rule_level && (
                        <span className={`level-badge level-${p.rule_level.toLowerCase()} text-xs`}>
                          {p.rule_level}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isStrong
                        ? 'bg-green-100 text-green-700'
                        : isWeak
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isStrong ? '✓ Strong' : isWeak ? '⚠ Needs work' : '~ Learning'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isStrong ? 'bg-green-500' : isWeak ? 'bg-red-400' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${p.accuracy}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{p.correct_attempts} correct / {p.total_attempts} total</span>
                    <span className="font-semibold text-slate-700">{p.accuracy}% accuracy</span>
                  </div>
                </div>
              )
            })}

            {grammarProgress.length > 0 && (
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-700 mb-1">Overall</p>
                <p className="text-xs text-indigo-600">
                  {grammarProgress.reduce((sum, p) => sum + p.total_attempts, 0)} exercises attempted across{' '}
                  {grammarProgress.length} grammar rule{grammarProgress.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Followers/Following Modal */}
        <FollowersFollowingModal
          user={user}
          currentUserId={currentUser?.id}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialTab={modalTab}
          followers={followers}
          following={following}
          followersLoading={followersLoading}
          followingLoading={followingLoading}
          onFollow={handleFollow}
          onViewUser={onViewUser}
        />
    </div>
  )
}
