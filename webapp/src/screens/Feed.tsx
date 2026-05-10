import { useEffect, useState, useCallback } from 'react'
import { fetchFeed, fetchDiscoverFeed, followUser, likePost, commentPost, listComments, getUser, deletePost, User, getImageUrl } from '../hooks/useApi'
import { PostCard } from '../components/PostCard'
import { CreatePostModal } from '../components/CreatePostModal'
import { Bell } from 'lucide-react'

export function Feed({ user, onDiscover, onUserUpdated, onViewUser, onNotifications, unreadNotifCount }: { user: User; onDiscover?: () => void; onUserUpdated?: () => void; onViewUser?: (userId: number) => void; onNotifications?: () => void; unreadNotifCount?: number }) {
  const userId = user.id
  const [items, setItems] = useState<any[]>([])
  const [feedTab, setFeedTab] = useState<'following' | 'discover'>('following')

  const handleDelete = async (postId: number) => {
    await deletePost(postId, userId)
    setItems((prev) => prev.filter((it) => it.post.id !== postId))
  }
  const [loading, setLoading] = useState(false)
  const [openPostId, setOpenPostId] = useState<number | null>(null)
  const [comments, setComments] = useState<Record<number, any[]>>({})
  const [commentText, setCommentText] = useState<Record<number, string>>({})
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [peekUser, setPeekUser] = useState<any | null>(null)
  const [peekLoading, setPeekLoading] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set())

  const loadFeed = useCallback(async () => {
    setLoading(true)
    const fetchFn = feedTab === 'following' ? fetchFeed : fetchDiscoverFeed
    const data = await fetchFn(userId, 20, 0)
    setItems(data.items || [])
    const alreadyLiked = new Set<number>(
      (data.items || [])
        .filter((it: any) => it.post.liked_by_me)
        .map((it: any) => it.post.id as number)
    )
    setLikedPosts(alreadyLiked)
    setLoading(false)
  }, [userId, feedTab])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleLike = async (postId: number) => {
    await likePost(postId, userId)
    setLikedPosts((prev) => {
      const newSet = new Set(prev)
      const isCurrentlyLiked = newSet.has(postId)
      const change = isCurrentlyLiked ? -1 : +1
      if (isCurrentlyLiked) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      // Update items with the correct change
      setItems((prevItems) =>
        prevItems.map((it) => {
          if (it.post.id !== postId) return it
          return { ...it, post: { ...it.post, likes: (it.post.likes || 0) + change } }
        })
      )
      return newSet
    })
  }

  const toggleComments = async (postId: number) => {
    if (openPostId === postId) {
      setOpenPostId(null)
      setCommentText((prev) => ({ ...prev, [postId]: '' }))
      return
    }
    setOpenPostId(postId)
    if (!comments[postId]) {
      setCommentsLoading(true)
      const data = await listComments(postId)
      setComments((prev) => ({ ...prev, [postId]: data }))
      setCommentsLoading(false)
    }
  }

  const handleCommentSubmit = async (postId: number) => {
    const text = (commentText[postId] || '').trim()
    if (!text) return
    await commentPost(postId, { user_id: userId, text })
    setCommentText((prev) => ({ ...prev, [postId]: '' }))
    setComments((prev) => ({
      ...prev,
      [postId]: [
        { id: Date.now(), user_id: userId, user, text, created_at: new Date().toISOString() },
        ...(prev[postId] || []),
      ],
    }))
    setItems((prev) =>
      prev.map((it) =>
        it.post.id === postId ? { ...it, post: { ...it.post, comments_count: (it.post.comments_count || 0) + 1 } } : it
      )
    )
  }

  const handleFollow = async (targetId: number) => {
    if (followedIds.has(targetId)) return
    await followUser(targetId, userId)
    setFollowedIds(prev => new Set([...prev, targetId]))
  }

  const viewUser = async (userIdToView: number) => {
    setPeekLoading(true)
    try {
      const u = await getUser(userIdToView)
      setPeekUser(u)
    } finally {
      setPeekLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-2 sm:p-4 lg:p-6 animate-qaw-fade-in-up" id="app">
      {/* Mobile header with search/notifications */}
      <div className="flex items-center justify-between md:hidden">
        <h2 className="text-xl font-bold text-slate-900">Feed</h2>
        <div className="flex gap-2">
          {onDiscover && (
            <button onClick={onDiscover} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" title="Search">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          )}
          {onNotifications && (
            <button onClick={onNotifications} className="p-2 rounded-xl hover:bg-slate-100 transition-colors relative" title="Notifications">
              <Bell size={20} className="text-slate-500" />
              {(unreadNotifCount || 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {(unreadNotifCount || 0) > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      <div className="card p-3 sm:p-4">
        <CreatePostModal userId={userId} onCreated={() => { loadFeed(); onUserUpdated?.() }} />
      </div>
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
        {(['following', 'discover'] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              feedTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'
            }`}
            onClick={() => setFeedTab(tab)}
          >
            {tab === 'following' ? '👥 Following' : '🌍 Discover'}
          </button>
        ))}
      </div>
      {loading && <p className="text-sm text-slate-500">Loading feed...</p>}
      {!loading && items.length === 0 && (
        <div className="text-center py-14 space-y-3">
          <p className="text-5xl">{feedTab === 'following' ? '🌱' : '🔍'}</p>
          <p className="text-slate-700 font-semibold text-lg">
            {feedTab === 'following' ? 'Your feed is empty' : 'No posts to discover'}
          </p>
          <p className="text-slate-400 text-sm">
            {feedTab === 'following' 
              ? 'Follow some learners to see their posts here' 
              : 'Check back later for new posts from other learners'}
          </p>
          {feedTab === 'following' && onDiscover && (
            <button className="btn-primary mt-2" onClick={onDiscover}>
              Discover people →
            </button>
          )}
        </div>
      )}
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.post.id} className="space-y-2">
            <PostCard
              id={it.post.id}
              author={{ id: it.author.id, username: it.author.username, level: it.author.level, city: it.author.city }}
              text={it.post.text}
              image_url={it.post.image_url}
              type={it.post.type}
              likes={it.post.likes}
              comments_count={it.post.comments_count}
              timestamp={it.post.timestamp ? new Date(it.post.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : undefined}
              onFollow={followedIds.has(it.author.id) ? undefined : () => handleFollow(it.author.id)}
              onLike={() => handleLike(it.post.id)}
              onComment={() => toggleComments(it.post.id)}
              onDelete={() => handleDelete(it.post.id)}
              commentsOpen={openPostId === it.post.id}
              currentUserId={userId}
              word={it.post.word || null}
              isLiked={likedPosts.has(it.post.id)}
            />
            {openPostId === it.post.id && (
              <div className="border border-slate-200 rounded-xl p-2 sm:p-3 space-y-3 bg-slate-50">
                <div className="flex gap-2">
                  <input
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    placeholder="Write a comment..."
                    value={commentText[it.post.id] || ''}
                    onChange={(e) => setCommentText((prev) => ({ ...prev, [it.post.id]: e.target.value }))}
                  />
                  <button className="btn-primary px-3 sm:px-4" onClick={() => handleCommentSubmit(it.post.id)} disabled={!(commentText[it.post.id] || '').trim()}>
                    Send
                  </button>
                </div>
                {commentsLoading ? (
                  <p className="text-xs text-slate-500">Loading comments...</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(comments[it.post.id] || []).map((c: any) => (
                      <div key={c.id} className="text-sm bg-white border rounded-lg px-2 sm:px-3 py-2">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <button className="font-semibold text-blue-600 text-sm" onClick={() => viewUser(c.user_id)}>
                            {c.user?.username || (c.user_id === userId ? user.username : `User ${c.user_id}`)}
                          </button>
                          <span className="text-[10px] sm:text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 mt-1">{c.text}</p>
                      </div>
                    ))}
                    {(!comments[it.post.id] || comments[it.post.id].length === 0) && (
                      <p className="text-xs text-slate-500">No comments yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
            {peekUser && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-2 sm:p-4" onClick={() => setPeekUser(null)}>
                <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 w-full max-w-sm space-y-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{peekUser.username}</h3>
                    <button className="text-slate-500 text-sm" onClick={() => setPeekUser(null)}>Close</button>
                  </div>
                  <p className="text-sm text-slate-600">{peekUser.city || '—'} · {peekUser.level}</p>
                  {peekUser.age && <p className="text-sm text-slate-600">{peekUser.age} years old</p>}
                  {peekUser.profile_photo && <img src={getImageUrl(peekUser.profile_photo)} alt="" className="w-full rounded-xl" />}
                <p className="text-xs text-slate-500">Words: {peekUser.words_count}</p>
                   {onViewUser && (
                     <button
                       className="btn-primary w-full mt-2 text-sm"
                       onClick={() => {
                         setPeekUser(null)
                         onViewUser(peekUser.id)
                       }}
                     >
                       View Profile →
                     </button>
                   )}
                 </div>
               </div>
             )}
      {peekLoading && <div className="fixed inset-0 pointer-events-none" />}
    </div>
  )
}
