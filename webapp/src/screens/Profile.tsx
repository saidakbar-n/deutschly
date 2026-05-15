import { useState, useEffect, useCallback } from 'react'
import { User, updateUser, listUserPosts, deletePost, listFollowers, listFollowing, followUser, unfollowUser, getUser, listWords, listWordsByFolder, listWordFolders, WordFolder, getImageUrl, fetchGrammarProgress, UserGrammarProgressRich, likePost, commentPost, listComments, deleteComment, changePremiumStatus, getStarWallet, activatePremium, type StarWallet } from '../hooks/useApi'
import { PostCard } from '../components/PostCard'
import { PostDetailModal } from '../components/PostDetailModal'
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader'
import { FollowersFollowingModal } from '../components/FollowersFollowingModal'
import { WordCard } from '../components/WordCard'
import type { TabType } from '../components/FollowersFollowingModal'
import { ArrowLeft, Loader2, Folder, FolderOpen, MessageCircle, Crown, X, Check, Star } from 'lucide-react'
import { createConversation } from '../hooks/useApi'

interface ProfileProps {
  user?: User
  userId?: number
  currentUser?: User
  onUpdated?: (user: User) => void
  onBack?: () => void
  onNavigate?: (screen: string) => void
  onViewUser?: (userId: number) => void
  onOpenChat?: (targetUserId: number) => void
}

export function Profile({ user: initialUser, userId, currentUser, onUpdated, onBack, onNavigate, onViewUser, onOpenChat }: ProfileProps) {
  const [status, setStatus] = useState('')
  const [wallet, setWallet] = useState<StarWallet | null>(null)
  const [premiumEmoji, setPremiumEmoji] = useState('')
  const [premiumLoading, setPremiumLoading] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [activateEmoji, setActivateEmoji] = useState('★')
  const [activating, setActivating] = useState(false)
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
  const [detailPostId, setDetailPostId] = useState<number | null>(null)
  const [detailComments, setDetailComments] = useState<any[]>([])
  const [detailCommentsLoading, setDetailCommentsLoading] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const detailPost = detailPostId ? posts.find((p) => p.id === detailPostId) : null

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

  const [isFollowing, setIsFollowing] = useState(false)
  const [viewerFollowing, setViewerFollowing] = useState<User[]>([])

  useEffect(() => {
    if (user && currentUser) {
      const loadViewerFollowing = async () => {
        try {
          const data = await listFollowing(currentUser.id)
          const followingList = data.following || []
          setViewerFollowing(followingList)
          if (!isOwnProfile) {
            setIsFollowing(followingList.some((f: User) => f.id === user.id))
          }
        } catch (error) {
          console.error('Failed to load following:', error)
        }
      }
      loadViewerFollowing()
    } else {
      setIsFollowing(false)
      setViewerFollowing([])
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

  const handlePostClick = async (post: any) => {
    setDetailPostId(post.id)
    setDetailCommentsLoading(true)
    try {
      const data = await listComments(post.id)
      setDetailComments(data || [])
    } finally {
      setDetailCommentsLoading(false)
    }
  }

  const handleDetailLike = async (postId: number) => {
    const uid = currentUser?.id || user?.id
    if (!uid) return
    await likePost(postId, uid)
    setLikedPosts((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes: (p.likes || 0) + (likedPosts.has(postId) ? -1 : 1) } : p
      )
    )
  }

  const handleDeleteComment = async (commentId: number) => {
    const uid = currentUser?.id || user?.id
    if (!uid) return
    await deleteComment(detailPost.id, commentId, uid)
    setDetailComments((prev) => prev.filter((c) => c.id !== commentId))
    setPosts((prev) =>
      prev.map((p) =>
        p.id === detailPost.id ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p
      )
    )
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
      if (user.is_premium && user.premium_status) {
        setPremiumEmoji(user.premium_status)
      }
      loadPosts()
      loadFollowers()
      loadFollowing()
    }
  }, [user, loadPosts, loadFollowers, loadFollowing])

  useEffect(() => {
    if (!user) return
    getStarWallet(user.id).then(w => {
      setWallet(w)
      if (w.is_premium) {
        setUser({ ...user, premium_status: w.premium_status, premium_expires_at: w.premium_expires_at, is_premium: true })
        if (w.premium_status) setPremiumEmoji(w.premium_status)
      }
    }).catch(() => {})
  }, [user?.id])

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
    try {
      const payload = { ...form, age: form.age ? Number(form.age) : undefined }
      const updated = await updateUser(user.id, payload)
      onUpdated?.(updated)
      setUser(updated)
      setEditMode(false)
      setStatus('Saved')
      setTimeout(() => setStatus(''), 1500)
    } catch {
      setStatus('Failed to save')
      setTimeout(() => setStatus(''), 3000)
    }
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
      if (viewerFollowing.some(f => f.id === targetUserId)) {
        await unfollowUser(targetUserId, currentUser.id)
        setViewerFollowing(prev => prev.filter(f => f.id !== targetUserId))
        if (isOwnProfile) {
          setUser(prev => prev ? { ...prev, following_count: Math.max(0, (prev.following_count || 0) - 1) } : prev)
        }
        if (targetUserId === user?.id) {
          setIsFollowing(false)
        }
        if (onUpdated) {
          onUpdated({ ...currentUser, following_count: Math.max(0, (currentUser.following_count || 0) - 1) })
        }
      } else {
        await followUser(targetUserId, currentUser.id)
        const followedUser = await getUser(targetUserId)
        setViewerFollowing(prev => [...prev, followedUser])
        if (isOwnProfile) {
          setUser(prev => prev ? { ...prev, following_count: (prev.following_count || 0) + 1 } : prev)
        }
        if (targetUserId === user?.id) {
          setIsFollowing(true)
        }
        if (onUpdated) {
          onUpdated({ ...currentUser, following_count: (currentUser.following_count || 0) + 1 })
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
        const updatedUser = { ...user, followers_count: Math.max(0, (user.followers_count || 0) - 1) }
        setUser(updatedUser)
        setIsFollowing(false)
        if (onUpdated) {
          onUpdated({ ...currentUser, following_count: Math.max(0, (currentUser.following_count || 0) - 1) })
        }
      } else {
        await followUser(user.id, currentUser.id)
        const updatedUser = { ...user, followers_count: (user.followers_count || 0) + 1 }
        setUser(updatedUser)
        setIsFollowing(true)
        if (onUpdated) {
          onUpdated({ ...currentUser, following_count: (currentUser.following_count || 0) + 1 })
        }
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
    <div className="space-y-4 md:space-y-6 animate-qaw-fade-in-up pb-4 md:pb-0">
      {/* Back Button (for viewing other users) */}
      {onBack && (
        <div className="px-4 md:px-0 pt-2">
          <button
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium min-h-[44px] native-touch-subtle"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Search</span>
            <span className="sm:hidden text-sm">Back</span>
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mx-3 md:mx-0 p-5 md:p-8">
        <div className="flex flex-col md:flex-row gap-5 md:gap-8 items-center md:items-start">
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
                    <input className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[48px]" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Username</label>
                    <input className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[48px]" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-z0-9_]/g, '').slice(0, 30) })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Age</label>
                    <input className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[48px]" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">City</label>
                    <input className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[48px]" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">German Level</label>
                    <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[48px]" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as User['level'] })}>
                      {['A1', 'A2', 'B1', 'B2', 'C1'].map((l) => (<option key={l} value={l}>{l}</option>))}
                    </select>
                  </div>
                </div>
                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">About</label>
                  <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none" rows={3} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
                </div>
                {user.is_premium && (
                  <div className="text-left pt-2 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Premium Status</label>
                    <div className="flex gap-2 flex-wrap">
                      {["⚡️", "❤️", "💘", "🐝", "★", "🧸", "💎", "🍻", "👑"].map(e => (
                        <button
                          key={e}
                          className={`w-10 h-10 text-xl rounded-xl transition-all flex items-center justify-center ${
                            premiumEmoji === e ? 'bg-yellow-100 ring-2 ring-yellow-400 scale-110' : 'hover:bg-slate-100'
                          } ${premiumLoading ? 'opacity-50 pointer-events-none' : ''}`}
                          onClick={async () => {
                            if (premiumLoading) return
                            setPremiumLoading(true)
                            setPremiumEmoji(e)
                            try {
                              const result = await changePremiumStatus(user.id, e)
                              const updated = { ...user, premium_status: result.premium_status }
                              setUser(updated)
                              onUpdated?.(updated)
                            } catch {
                              setPremiumEmoji(user.premium_status || '')
                            } finally {
                              setPremiumLoading(false)
                            }
                          }}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-center md:justify-end gap-3 pt-2">
                  <button className="flex-1 sm:flex-none px-5 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-all text-sm min-h-[48px]" onClick={() => { setEditMode(false); setForm({ username: user.username, city: user.city || '', level: user.level, full_name: user.full_name || '', about: user.about || '', age: user.age ? String(user.age) : '' }); }}>Cancel</button>
                  <button className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-200 transition-all text-sm disabled:opacity-50 min-h-[48px]" onClick={save} disabled={status === 'Saving...'}>{status === 'Saving...' ? 'Saving...' : 'Save'}</button>
                  {status === 'Saved' && <span className="text-green-600 text-sm font-medium self-center">Saved!</span>}
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
                    <p className="text-sm text-slate-800 mt-0.5">
                      @{user.username}
                      {user.is_premium && user.premium_status && (
                        <span className="text-xl ml-1" title={user.premium_expires_at ? `Premium until ${new Date(user.premium_expires_at).toLocaleDateString()}` : undefined}>
                          {user.premium_status}
                        </span>
                      )}
                    </p>
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
                  <div className="flex justify-center md:justify-end pt-2">
                    <button className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-200 transition-all text-sm min-h-[48px]" onClick={() => setEditMode(true)}>Edit Profile</button>
                  </div>
                ) : (
                  <div className="flex flex-row justify-center md:justify-end pt-2 gap-3">
                    <button
                      className={`flex-1 sm:flex-none px-6 py-3 font-semibold rounded-xl shadow-md transition-all text-sm min-h-[48px] ${
                        isFollowing
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200'
                      }`}
                      onClick={handleFollowButton}
                      disabled={followLoading}
                    >
                      {followLoading ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
                    </button>
                    <button
                      className="flex-1 sm:flex-none px-5 py-3 font-semibold rounded-xl shadow-md transition-all text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 min-h-[48px]"
                      onClick={() => {
                        if (onOpenChat && user?.id) {
                          onOpenChat(user.id)
                        } else {
                          onNavigate?.('chat')
                        }
                      }}
                    >
                      <MessageCircle size={18} />
                      Message
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follower and Following Stats Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mx-3 md:mx-0 p-4 md:p-6">
        <div className="flex items-center justify-center gap-4 md:gap-8">
          <button
            className="flex-1 text-center hover:bg-slate-50 rounded-xl p-3 md:p-3 transition-colors min-h-[52px] flex flex-col items-center justify-center native-touch-subtle"
            onClick={() => openFollowersModal('followers')}
          >
            <p className="text-xl md:text-2xl font-bold text-indigo-700">{user.followers_count || 0}</p>
            <p className="text-xs md:text-sm text-slate-600 font-medium">Followers</p>
          </button>
          <div className="w-px h-10 md:h-12 bg-slate-200" />
          <button
            className="flex-1 text-center hover:bg-slate-50 rounded-xl p-3 md:p-3 transition-colors min-h-[52px] flex flex-col items-center justify-center native-touch-subtle"
            onClick={() => openFollowersModal('following')}
          >
            <p className="text-xl md:text-2xl font-bold text-indigo-700">{user.following_count || 0}</p>
            <p className="text-xs md:text-sm text-slate-600 font-medium">Following</p>
          </button>
        </div>
      </div>

      {/* Premium & Stars - own profile only */}
      {isOwnProfile && wallet && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Star size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {wallet.balance} {wallet.balance === 1 ? 'Star' : 'Stars'}
                </p>
                {wallet.is_premium && wallet.premium_status ? (
                  <p className="text-xs text-yellow-700">
                    Premium active {wallet.premium_status} · expires {wallet.premium_expires_at ? new Date(wallet.premium_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Activate premium for 100 stars</p>
                )}
              </div>
            </div>
            {!wallet.is_premium && (
              <button
                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold rounded-xl hover:from-yellow-500 hover:to-yellow-600 shadow-md shadow-yellow-200 transition-all text-sm"
                onClick={() => { setActivateEmoji('★'); setShowPremiumModal(true) }}
              >
                Activate Premium
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mx-3 md:mx-0 p-4 md:p-6 lg:p-8">
        {/* Tab Navigation - sticky on mobile */}
        <div className="sticky -top-1 z-10 bg-white flex border-b border-slate-200 mb-4 md:mb-6 overflow-x-auto scrollbar-hide -mx-4 md:mx-0 px-4 md:px-0">
          <button
            className={`px-4 py-3 md:px-6 md:py-3 font-semibold text-sm transition-all whitespace-nowrap min-h-[44px] ${
              activeTab === 'posts'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            Posts ({user.posts_count || 0})
          </button>
          <button
            className={`px-4 py-3 md:px-6 md:py-3 font-semibold text-sm transition-all whitespace-nowrap min-h-[44px] ${
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
              className={`px-4 py-3 md:px-6 md:py-3 font-semibold text-sm transition-all whitespace-nowrap min-h-[44px] ${
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
            <div className="flex items-center gap-1.5 text-orange-600 font-semibold text-sm px-4 py-2 shrink-0">
              <span>🔥</span>
              <span className="whitespace-nowrap">{user.streak} day streak</span>
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
                      author={{ id: p.user_id, username: user.username, level: user.level, city: user.city, profile_photo: user.profile_photo }}
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
                      onClick={() => handlePostClick(p)}
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

      {/* Post Detail Modal */}
      {detailPost && (
        <PostDetailModal
          post={{
            id: detailPost.id,
            text: detailPost.text,
            image_url: detailPost.image_url,
            type: detailPost.type,
            likes: detailPost.likes,
            comments_count: detailPost.comments_count,
            timestamp: detailPost.timestamp ? new Date(detailPost.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : undefined,
            word: detailPost.word || null,
          }}
          author={{ id: user?.id, username: user?.username || '', level: user?.level, city: user?.city, profile_photo: user?.profile_photo }}
          isLiked={likedPosts.has(detailPost.id)}
          currentUserId={currentUser?.id || user?.id || 0}
          onClose={() => { setDetailPostId(null); setDetailComments([]) }}
          onLike={() => handleDetailLike(detailPost.id)}
          onDelete={isOwnProfile ? async () => {
            await deletePost(detailPost.id, user?.id || 0)
            setPosts((prev) => prev.filter((x) => x.id !== detailPost.id))
            setDetailPostId(null)
          } : undefined}
          comments={detailComments}
          commentsLoading={detailCommentsLoading}
          onCommentSubmit={async (text) => {
            const uid = currentUser?.id || user?.id
            if (!uid) return
            const created = await commentPost(detailPost.id, { user_id: uid, text })
            setDetailComments((prev) => [
              { ...created, user: created.user || { id: uid, username: currentUser?.username || user?.username } },
              ...prev,
            ])
            setPosts((prev) =>
              prev.map((p) =>
                p.id === detailPost.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
              )
            )
          }}
          onDeleteComment={handleDeleteComment}
        />
      )}

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
          viewerFollowingIds={new Set(viewerFollowing.map(f => f.id))}
          onFollow={handleFollow}
          onViewUser={onViewUser}
        />

      {/* Premium Activation Modal — bottom sheet on mobile */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowPremiumModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm sm:m-4 p-6 max-h-[85vh] overflow-y-auto overscroll-contain modal-scroll" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-handle sm:hidden mb-4" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Crown size={18} className="text-yellow-500" />
                Activate Premium
              </h3>
              <button className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors" onClick={() => setShowPremiumModal(false)}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              100 stars for 30 days of premium status. Choose your emoji:
            </p>
            <div className="flex gap-2 flex-wrap justify-center mb-4">
              {["⚡️", "❤️", "💘", "🐝", "★", "🧸", "💎", "🍻", "👑"].map(e => (
                <button
                  key={e}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all native-touch ${
                    activateEmoji === e ? 'bg-yellow-100 ring-2 ring-yellow-400 scale-110' : 'hover:bg-slate-100'
                  }`}
                  onClick={() => setActivateEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:translate-y-[1px] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
              onClick={async () => {
                if (activating || !wallet || wallet.balance < 100) return
                setActivating(true)
                try {
                  const result = await activatePremium(user!.id, activateEmoji)
                  setWallet(prev => prev ? { ...prev, premium_status: result.premium_status, premium_expires_at: result.premium_expires_at, is_premium: true, balance: result.balance } : null)
                  setUser(prev => prev ? { ...prev, premium_status: result.premium_status, premium_expires_at: result.premium_expires_at, is_premium: true } : null)
                  setPremiumEmoji(activateEmoji)
                  setShowPremiumModal(false)
                } catch {
                  alert('Failed to activate premium. Make sure you have 100 stars.')
                } finally {
                  setActivating(false)
                }
              }}
              disabled={activating || !wallet || wallet.balance < 100}
            >
              {activating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-qaw-spin" />
              ) : (
                <Check size={18} />
              )}
              Activate — 100 ★
            </button>
            {wallet && wallet.balance < 100 && (
              <p className="text-xs text-red-500 mt-2 text-center">Not enough stars. Buy stars first.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
