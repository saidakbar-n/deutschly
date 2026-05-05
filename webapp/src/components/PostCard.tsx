import { Heart, MessageCircle, UserPlus, MoreVertical, Trash2 } from 'lucide-react'

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

// QA Wolf-style type badge
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

// QA Wolf-style level badge
const LevelBadge = ({ level }: { level?: string }) => {
  if (!level) return null
  return <span className={`level-badge level-${level.toLowerCase()}`}>{level}</span>
}

export function PostCard({ 
  author, 
  text, 
  image_url, 
  type, 
  likes = 0, 
  comments_count = 0,
  onFollow, 
  onLike, 
  onComment, 
  commentsOpen,
  currentUserId,
  onDelete,
  timestamp,
}: PostCardProps) {
  const safeImage = image_url || undefined
  const isMine = currentUserId !== undefined && author.id === currentUserId
  
  return (
    <div className="card group hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 w-full">
      {/* Author Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-sky-100 rounded-xl flex items-center justify-center">
            <span className="text-lg">🐺</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm sm:text-base">{author.username}</p>
            <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-500 flex-wrap">
              <LevelBadge level={author.level} />
              <span className="hidden sm:inline">·</span>
              <span>{author.city || '—'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 sm:ml-auto">
          {!isMine && onFollow && (
            <button 
              className="text-indigo-600 text-xs sm:text-sm flex items-center gap-1 hover:bg-indigo-50 px-2 sm:px-3 py-1.5 rounded-xl transition-colors"
              onClick={onFollow}
            >
              <UserPlus size={14} className="sm:hidden" /><UserPlus size={16} className="hidden sm:inline" /> <span className="hidden sm:inline">Follow</span>
            </button>
          )}
          {isMine && onDelete && (
            <button 
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"
              onClick={onDelete}
            >
              <Trash2 size={14} className="sm:hidden" /><Trash2 size={16} className="hidden sm:inline" />
            </button>
          )}
        </div>
      </div>

      {/* Post Content */}
      {safeImage && (
        <div className="rounded-xl overflow-hidden mb-3 sm:mb-4 shadow-lg shadow-slate-200 border-2 sm:border-4 border-slate-200">
          <div className="aspect-video bg-slate-50">
            <img src={safeImage} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
      
      {text && (
        <p className="text-slate-700 mb-3 sm:mb-4 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
          {text}
        </p>
      )}

      {/* Post Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            className="flex items-center gap-1 sm:gap-1.5 text-slate-600 hover:text-red-500 transition-colors group"
            onClick={onLike}
          >
            <div className="p-1.5 sm:p-2 rounded-xl bg-slate-100 group-hover:bg-red-50 transition-colors">
              <Heart size={16} className="sm:hidden group-hover:fill-red-500" /><Heart size={18} className="hidden sm:inline group-hover:fill-red-500" />
            </div>
            <span className="text-xs sm:text-sm font-medium">{likes}</span>
          </button>
          
          <button 
            className={`flex items-center gap-1 sm:gap-1.5 text-slate-600 hover:text-indigo-500 transition-colors group
              ${commentsOpen ? 'text-indigo-600' : ''}`}
            onClick={onComment}
          >
            <div className="p-1.5 sm:p-2 rounded-xl bg-slate-100 group-hover:bg-indigo-50 transition-colors">
              <MessageCircle size={16} className="sm:hidden" /><MessageCircle size={18} className="hidden sm:inline" />
            </div>
            <span className="text-xs sm:text-sm font-medium">{comments_count}</span>
          </button>
        </div>
        
        <div className="sm:ml-auto">
          <TypeBadge type={type} />
        </div>
      </div>

      {timestamp && (
        <p className="text-xs text-slate-400 mt-2 sm:mt-3">{timestamp}</p>
      )}
    </div>
  )
}
