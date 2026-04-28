import { useEffect, useState, useCallback } from 'react'
import { fetchFeed, followUser, likePost, commentPost, listComments, getUser, User } from '../hooks/useApi'
import { PostCard } from '../components/PostCard'
import { CreatePostModal } from '../components/CreatePostModal'

export function Feed({ user }: { user: User }) {
  const userId = user.id
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openPostId, setOpenPostId] = useState<number | null>(null)
  const [comments, setComments] = useState<Record<number, any[]>>({})
  const [commentText, setCommentText] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [peekUser, setPeekUser] = useState<any | null>(null)
  const [peekLoading, setPeekLoading] = useState(false)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    const data = await fetchFeed(userId, 20, 0)
    setItems(data.items || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleLike = async (postId: number) => {
    await likePost(postId, userId)
    setItems((prev) =>
      prev.map((it) =>
        it.post.id === postId ? { ...it, post: { ...it.post, likes: (it.post.likes || 0) + 1 } } : it
      )
    )
  }

  const toggleComments = async (postId: number) => {
    if (openPostId === postId) {
      setOpenPostId(null)
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
    if (!commentText.trim()) return
    const text = commentText.trim()
    await commentPost(postId, { user_id: userId, text })
    setCommentText('')
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
    await followUser(targetId, userId)
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
    <div className="space-y-4" id="app">
      <CreatePostModal userId={userId} onCreated={loadFeed} />
      {loading && <p className="text-sm text-slate-500">Loading feed...</p>}
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
              onFollow={() => handleFollow(it.author.id)}
              onLike={() => handleLike(it.post.id)}
              onComment={() => toggleComments(it.post.id)}
              commentsOpen={openPostId === it.post.id}
              currentUserId={userId}
            />
            {openPostId === it.post.id && (
              <div className="border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50">
                <div className="flex gap-2">
                  <input
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button className="btn-primary" onClick={() => handleCommentSubmit(it.post.id)} disabled={!commentText.trim()}>
                    Send
                  </button>
                </div>
                {commentsLoading ? (
                  <p className="text-xs text-slate-500">Loading comments...</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(comments[it.post.id] || []).map((c: any) => (
                      <div key={c.id} className="text-sm bg-white border rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between">
                          <button className="font-semibold text-blue-600" onClick={() => viewUser(c.user_id)}>
                            {c.user?.username || (c.user_id === userId ? user.username : `User ${c.user_id}`)}
                          </button>
                          <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
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
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={() => setPeekUser(null)}>
                <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-sm space-y-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{peekUser.username}</h3>
                    <button className="text-slate-500 text-sm" onClick={() => setPeekUser(null)}>Close</button>
                  </div>
                  <p className="text-sm text-slate-600">{peekUser.city || '—'} · {peekUser.level}</p>
                  {peekUser.age && <p className="text-sm text-slate-600">{peekUser.age} years old</p>}
                  {peekUser.profile_photo && <img src={peekUser.profile_photo} alt="" className="w-full rounded-xl" />}
                  <p className="text-xs text-slate-500">Words: {peekUser.words_count}</p>
                </div>
              </div>
            )}
      {peekLoading && <div className="fixed inset-0 pointer-events-none" />}
    </div>
  )
}
