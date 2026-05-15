import { useState } from 'react'
import { Heart, MessageCircle, X, Trash2, User } from 'lucide-react'
import { getImageUrl } from '../hooks/useApi'
import type { PostWord } from './PostCard'

function getArticleColor(term: string, isSingular: boolean): string {
  const trimmedTerm = term.trim().toLowerCase()
  if (trimmedTerm.startsWith('der ')) return 'bg-blue-100 text-blue-700'
  if (trimmedTerm.startsWith('das ')) return 'bg-green-100 text-green-700'
  if (trimmedTerm.startsWith('die ')) return isSingular ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
  return ''
}

const TypeBadge = ({ type }: { type: string }) => {
  const typeConfig: Record<string, { icon: string; color: string }> = {
    story: { icon: '📖', color: 'bg-sky-100 text-sky-700' },
    achievement: { icon: '🏆', color: 'bg-amber-100 text-amber-700' },
    tip: { icon: '💡', color: 'bg-green-100 text-green-700' },
    question: { icon: '❓', color: 'bg-indigo-100 text-indigo-700' },
  }
  const config = typeConfig[type.toLowerCase()] || { icon: '📝', color: 'bg-slate-100 text-slate-700' }
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${config.color}`}>
      {config.icon} {type}
    </span>
  )
}

export type PostDetailModalProps = {
  post: {
    id: number
    text?: string
    image_url?: string
    type: string
    likes?: number
    comments_count?: number
    timestamp?: string
    word?: PostWord | null
  }
  author: { id?: number; username: string; level?: string; city?: string; is_premium?: boolean; premium_status?: string; profile_photo?: string | null }
  isLiked: boolean
  currentUserId: number
  onClose: () => void
  onLike: () => void
  onDelete?: () => void
  onFollow?: () => void
  onViewUser?: (userId: number) => void
  comments?: any[]
  commentsLoading?: boolean
  onCommentSubmit?: (text: string) => void
  onDeleteComment?: (commentId: number) => void
}

export function PostDetailModal({
  post,
  author,
  isLiked,
  currentUserId,
  onClose,
  onLike,
  onDelete,
  onFollow,
  onViewUser,
  comments,
  commentsLoading,
  onCommentSubmit,
  onDeleteComment,
}: PostDetailModalProps) {
  const safeImage = getImageUrl(post.image_url)
  const isMine = author.id === currentUserId
  const [wordFlipped, setWordFlipped] = useState(false)
  const [commentText, setCommentText] = useState('')

  const handleComment = () => {
    const text = commentText.trim()
    if (!text || !onCommentSubmit) return
    onCommentSubmit(text)
    setCommentText('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet-handle sm:hidden mb-4 mt-2" />
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-3 sm:p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0">
              {author.profile_photo ? (
                <img src={getImageUrl(author.profile_photo)} className="w-full h-full object-cover" alt={author.username} />
              ) : (
                <span className="text-slate-400"><User size={20} /></span>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm sm:text-base">
                {author.username}
                {author.is_premium && author.premium_status && (
                  <span className="text-sm ml-0.5">{author.premium_status}</span>
                )}
              </p>
              <p className="text-xs text-slate-500">{author.level} · {author.city || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMine && onDelete && (
              <button className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors min-h-[36px] native-touch" onClick={onDelete}>Delete</button>
            )}
            {!isMine && onFollow && (
              <button className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors min-h-[36px] native-touch" onClick={onFollow}>Follow</button>
            )}
            <button className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors native-touch" onClick={onClose}>
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 space-y-4">
          {/* Image */}
          {safeImage && (
            <div className="rounded-xl overflow-hidden shadow-lg border border-slate-200">
              <img src={safeImage} alt="" className="w-full max-h-96 object-cover" />
            </div>
          )}

          {/* Text */}
          {post.text && (
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
              {post.text}
            </p>
          )}

          {/* Word */}
          {post.word && (
            <div
              className="relative cursor-pointer select-none"
              onClick={() => setWordFlipped((f) => !f)}
            >
              <div className="bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-100 rounded-xl p-3 sm:p-4 text-center transition-all duration-200 hover:shadow-md">
                {!wordFlipped ? (
                  <>
                    <p className="text-xs text-indigo-400 font-medium mb-1">Vocabulary</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900">
                      {post.word.term.split(' ')[0] && (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${getArticleColor(post.word.term, post.word.is_singular !== false)}`}>
                          {post.word.term.split(' ')[0]}
                        </span>
                      )}
                      <span className="ml-1">{post.word.term.split(' ').slice(1).join(' ')}</span>
                    </p>
                    <p className="text-[10px] text-indigo-400 mt-1">Tap to reveal meaning</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-indigo-400 font-medium mb-1">Meaning</p>
                    <p className="text-base sm:text-lg font-semibold text-indigo-700">{post.word.meaning}</p>
                    {post.word.note && <p className="text-xs text-slate-500 mt-1">{post.word.note}</p>}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-slate-600 hover:text-red-500 transition-colors min-h-[44px] native-touch" onClick={onLike}>
                <Heart size={18} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
                <span className="text-sm font-medium">{post.likes || 0}</span>
              </button>
              <div className="flex items-center gap-1.5 text-slate-600">
                <MessageCircle size={18} />
                <span className="text-sm font-medium">{post.comments_count || 0}</span>
              </div>
            </div>
            <TypeBadge type={post.type} />
          </div>

          {post.timestamp && (
            <p className="text-xs text-slate-400">{post.timestamp}</p>
          )}

          {/* Comments */}
          {onCommentSubmit && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded-lg px-3 py-2 text-base min-h-[44px]"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <button className="btn-primary px-4 min-h-[44px] native-touch" onClick={handleComment} disabled={!commentText.trim()}>
                  Send
                </button>
              </div>
              {commentsLoading ? (
                <p className="text-xs text-slate-500">Loading comments...</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(comments || []).map((c: any) => {
                    const canDelete = onDeleteComment && (c.user_id === currentUserId || author.id === currentUserId)
                    return (
                      <div key={c.id} className="text-sm bg-slate-50 border rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <button
                            className="font-semibold text-blue-600 text-sm"
                            onClick={() => onViewUser?.(c.user_id)}
                          >
                            {c.user?.username || `User ${c.user_id}`}
                            {c.user?.is_premium && c.user?.premium_status && (
                              <span className="text-xs ml-0.5">{c.user.premium_status}</span>
                            )}
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                            {canDelete && (
                              <button
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                onClick={() => onDeleteComment(c.id)}
                                title="Delete comment"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-700 mt-1">{c.text}</p>
                      </div>
                    )
                  })}
                  {(comments || []).length === 0 && (
                    <p className="text-xs text-slate-500">No comments yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
