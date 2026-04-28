import { Heart, MessageCircle, UserPlus } from 'lucide-react'

export type PostCardProps = {
  id: number
  author: { id?: number; username: string; level?: string; city?: string }
  text?: string
  image_url?: string
  type: string
  likes?: number
  timestamp?: string
  comments_count?: number
  onFollow?: () => void
  onLike?: () => void
  onComment?: () => void
  commentsOpen?: boolean
  currentUserId?: number
  onDelete?: () => void
}

export function PostCard({ author, text, image_url, type, likes, comments_count, onFollow, onLike, onComment, commentsOpen, currentUserId, onDelete }: PostCardProps) {
  const safeImage = image_url || undefined
  const isMine = currentUserId !== undefined && author.id === currentUserId
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{author.username}</p>
          <p className="text-xs text-slate-500">{author.level} · {author.city || '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isMine && onFollow && (
            <button className="text-blue-600 text-sm flex items-center gap-1" onClick={onFollow}>
              <UserPlus size={16} /> Follow
            </button>
          )}
          {isMine && onDelete && (
            <button className="text-xs text-red-600" onClick={onDelete}>Delete</button>
          )}
        </div>
      </div>
      {safeImage && <img src={safeImage} alt="" className="rounded-xl mt-3 mb-2 w-full object-cover" />}
      {text && <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{text}</p>}
      <div className="flex items-center gap-4 text-slate-600 text-sm">
        <button className="flex items-center gap-1" onClick={onLike}><Heart size={16} /> {likes ?? 0}</button>
        <button className={`flex items-center gap-1 ${commentsOpen ? 'text-blue-600 font-semibold' : ''}`} onClick={onComment}><MessageCircle size={16} /> {comments_count ?? 0}</button>
        <span className="text-xs uppercase tracking-wide bg-slate-100 px-2 py-1 rounded-full">{type}</span>
      </div>
    </div>
  )
}
