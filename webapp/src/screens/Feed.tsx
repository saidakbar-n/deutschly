import { useEffect, useState, useCallback } from 'react'
import { fetchFeed, fetchDiscoverFeed, followUser, likePost, commentPost, listComments, getUser, deletePost, deleteComment, User, getImageUrl } from '../hooks/useApi'
import { PostCard } from '../components/PostCard'
import { PostDetailModal } from '../components/PostDetailModal'
import { CreatePostModal } from '../components/CreatePostModal'
import { Bell, Trash2, Search, X, TreePine } from 'lucide-react'

export function Feed({ user, onDiscover, onUserUpdated, onViewUser, onNotifications, onProgress, unreadNotifCount }: { user: User; onDiscover?: () => void; onUserUpdated?: () => void; onViewUser?: (userId: number) => void; onNotifications?: () => void; onProgress?: () => void; unreadNotifCount?: number }) {
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
  const [detailPostId, setDetailPostId] = useState<number | null>(null)
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

  const handleCardClick = async (item: any) => {
    setDetailPostId(item.post.id)
    if (!comments[item.post.id]) {
      setCommentsLoading(true)
      const data = await listComments(item.post.id)
      setComments((prev) => ({ ...prev, [item.post.id]: data }))
      setCommentsLoading(false)
    }
  }

  const detailItem = detailPostId ? items.find((it) => it.post.id === detailPostId) : null

  const handleLike = async (postId: number) => {
    await likePost(postId, userId)
    setLikedPosts((prev) => {
      const newSet = new Set(prev)
      const isCurrentlyLiked = newSet.has(postId)
      const change = isCurrentlyLiked ? -1 : +1
      if (isCurrentlyLiked) newSet.delete(postId)
      else newSet.add(postId)
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
    const created = await commentPost(postId, { user_id: userId, text })
    setCommentText((prev) => ({ ...prev, [postId]: '' }))
    setComments((prev) => ({
      ...prev,
      [postId]: [{ ...created, user: created.user || user }, ...(prev[postId] || [])],
    }))
    setItems((prev) =>
      prev.map((it) =>
        it.post.id === postId ? { ...it, post: { ...it.post, comments_count: (it.post.comments_count || 0) + 1 } } : it
      )
    )
  }

  const handleDeleteComment = async (postId: number, commentId: number) => {
    await deleteComment(postId, commentId, userId)
    setComments((prev) => ({ ...prev, [postId]: (prev[postId] || []).filter((c) => c.id !== commentId) }))
    setItems((prev) =>
      prev.map((it) =>
        it.post.id === postId ? { ...it, post: { ...it.post, comments_count: Math.max(0, (it.post.comments_count || 0) - 1) } } : it
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
    <div className="divide-y divide-transparent mobile-container pb-4 md:pb-0">
      {/* Page header — mobile only */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 md:hidden">
        <h1 className="text-lg font-bold text-slate-900">Feed</h1>
        <div className="flex gap-1.5">
          {onProgress && (
            <button onClick={onProgress} className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors native-touch-subtle">
              <TreePine size={20} className="text-slate-500" />
            </button>
          )}
          {onDiscover && (
            <button onClick={onDiscover} className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors native-touch-subtle">
              <Search size={20} className="text-slate-500" />
            </button>
          )}
          {onNotifications && (
            <button onClick={onNotifications} className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors relative native-touch-subtle">
              <Bell size={20} className="text-slate-500" />
              {(unreadNotifCount || 0) > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                  {(unreadNotifCount || 0) > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Create Post */}
      <div className="px-3 sm:px-0 mb-3">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 p-3 sm:p-4">
          <CreatePostModal userId={userId} onCreated={() => { loadFeed(); onUserUpdated?.() }} />
        </div>
      </div>

      {/* Feed Tabs */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm px-3 sm:px-0 pb-2 pt-1 -mt-1 border-b border-slate-100 mb-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['following', 'discover'] as const).map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                feedTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'
              }`}
              onClick={() => setFeedTab(tab)}
            >
              {tab === 'following' ? '👥 Following' : '🌍 Discover'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-0">
        {/* Mobile/Tablet: single column. Desktop: 2-column grid */}
        <div className="space-y-3 xl:grid xl:grid-cols-2 xl:gap-3 xl:space-y-0">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-qaw-spin" />
            <span className="ml-2 text-sm text-slate-500">Loading feed...</span>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-12 space-y-3 px-4">
            <p className="text-4xl">{feedTab === 'following' ? '🌱' : '🔍'}</p>
            <p className="text-slate-700 font-semibold text-base">
              {feedTab === 'following' ? 'Your feed is empty' : 'No posts to discover'}
            </p>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              {feedTab === 'following' 
                ? 'Follow some learners to see their posts here' 
                : 'Check back later for new posts from other learners'}
            </p>
            {feedTab === 'following' && onDiscover && (
              <button className="btn-primary mt-2 text-sm min-h-[44px]" onClick={onDiscover}>
                Discover people →
              </button>
            )}
          </div>
        )}

        {items.map((it) => (
          <div key={it.post.id} className="space-y-2">
            <PostCard
              id={it.post.id}
              author={{ id: it.author.id, username: it.author.username, level: it.author.level, city: it.author.city, profile_photo: it.author.profile_photo }}
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
              onClick={() => handleCardClick(it)}
            />
            {openPostId === it.post.id && (
              <div className="bg-white border border-slate-200 rounded-xl mx-1 sm:mx-0 overflow-hidden">
                {/* Comment input */}
                <div className="flex gap-2 p-3 border-b border-slate-100">
                  <input
                    className="flex-1 rounded-xl px-4 py-3 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base min-h-[44px]"
                    placeholder="Write a comment..."
                    value={commentText[it.post.id] || ''}
                    onChange={(e) => setCommentText((prev) => ({ ...prev, [it.post.id]: e.target.value }))}
                  />
                  <button 
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all active:translate-y-[1px] px-4"
                    onClick={() => handleCommentSubmit(it.post.id)} 
                    disabled={!(commentText[it.post.id] || '').trim()}
                  >
                    Send
                  </button>
                </div>
                
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-qaw-spin" />
                    <span className="ml-2 text-xs text-slate-500">Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto overscroll-contain px-3 py-2">
                    {(comments[it.post.id] || []).map((c: any) => {
                      const canDelete = c.user_id === userId || it.author.id === userId
                      return (
                        <div key={c.id} className="bg-slate-50 rounded-xl px-3 py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <button className="font-semibold text-indigo-600 text-sm" onClick={() => viewUser(c.user_id)}>
                              {c.user?.username || (c.user_id === userId ? user.username : `User ${c.user_id}`)}
                              {c.user?.is_premium && c.user?.premium_status && (
                                <span className="text-xs ml-0.5">{c.user.premium_status}</span>
                              )}
                            </button>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                              {canDelete && (
                                <button className="min-h-[32px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" onClick={() => handleDeleteComment(it.post.id, c.id)} title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-700 text-sm mt-1">{c.text}</p>
                        </div>
                      )
                    })}
                    {(!comments[it.post.id] || comments[it.post.id].length === 0) && (
                      <p className="text-xs text-slate-400 text-center py-3">No comments yet. Be the first!</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Peek User Modal — bottom sheet on mobile */}
      {peekUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setPeekUser(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm sm:m-4 p-5 sm:p-6 max-h-[80vh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle sm:hidden mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                {peekUser.username}
                {peekUser.is_premium && peekUser.premium_status && (
                  <span className="text-base">{peekUser.premium_status}</span>
                )}
              </h3>
              <button className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-400" onClick={() => setPeekUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">{peekUser.city || '—'} · {peekUser.level}</p>
              {peekUser.age && <p className="text-sm text-slate-600">{peekUser.age} years old</p>}
              {peekUser.profile_photo && (
                <img src={getImageUrl(peekUser.profile_photo)} alt="" className="w-full rounded-xl max-h-48 object-cover" />
              )}
              <p className="text-xs text-slate-500">Words: {peekUser.words_count}</p>
              {onViewUser && (
                <button
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 active:translate-y-[1px] transition-all text-sm min-h-[48px]"
                  onClick={() => { setPeekUser(null); onViewUser(peekUser.id) }}
                >
                  View Profile →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {peekLoading && <div className="fixed inset-0 pointer-events-none" />}

      {detailItem && (
        <PostDetailModal
          post={{
            id: detailItem.post.id,
            text: detailItem.post.text,
            image_url: detailItem.post.image_url,
            type: detailItem.post.type,
            likes: detailItem.post.likes,
            comments_count: detailItem.post.comments_count,
            timestamp: detailItem.post.timestamp ? new Date(detailItem.post.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : undefined,
            word: detailItem.post.word || null,
          }}
          author={{ id: detailItem.author.id, username: detailItem.author.username, level: detailItem.author.level, city: detailItem.author.city, profile_photo: detailItem.author.profile_photo }}
          isLiked={likedPosts.has(detailItem.post.id)}
          currentUserId={userId}
          onClose={() => setDetailPostId(null)}
          onLike={() => handleLike(detailItem.post.id)}
          onDelete={detailItem.author.id === userId ? () => { handleDelete(detailItem.post.id); setDetailPostId(null); } : undefined}
          onViewUser={(id) => { setDetailPostId(null); onViewUser?.(id) }}
          comments={comments[detailItem.post.id]}
          commentsLoading={commentsLoading}
          onCommentSubmit={async (text) => {
            const created = await commentPost(detailItem.post.id, { user_id: userId, text })
            setComments((prev) => ({
              ...prev,
              [detailItem.post.id]: [
                { ...created, user: created.user || { id: userId, username: user.username } },
                ...(prev[detailItem.post.id] || []),
              ],
            }))
            setItems((prev) =>
              prev.map((it) =>
                it.post.id === detailItem.post.id ? { ...it, post: { ...it.post, comments_count: (it.post.comments_count || 0) + 1 } } : it
              )
            )
          }}
          onDeleteComment={(commentId) => handleDeleteComment(detailItem.post.id, commentId)}
        />
      )}
      </div>
    </div>
  )
}
