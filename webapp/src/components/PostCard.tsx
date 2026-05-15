import { useState } from 'react'
import { Heart, MessageCircle, UserPlus, Trash2, Star } from 'lucide-react'

export type PostWord = {
  id: number
  term: string
  meaning: string
  note?: string
  is_singular?: boolean
}

const EMOJIS = ["⚡️", "❤️", "💘", "🐝", "★", "🧸", "💎", "🍻", "👑"]

function ReactionPicker({ onReact }: { onReact: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-yellow-500 hover:border-yellow-300 hover:bg-yellow-50 text-sm transition-all"
        onClick={() => setOpen(o => !o)}
      >
        ✦ React
      </button>
      {open && (
        <div className="absolute bottom-8 left-0 z-20 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 flex gap-1.5 flex-wrap max-w-[200px]">
          {EMOJIS.map(e => (
            <button
              key={e}
              className="text-xl hover:scale-125 transition-transform p-1 rounded-xl hover:bg-yellow-50"
              onClick={() => { onReact(e); setOpen(false) }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export type PostCardProps = {
  id: number
  author: { id?: number; username: string; level?: string; city?: string; is_premium?: boolean; premium_status?: string | null }
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
  word?: PostWord | null
  isLiked?: boolean
  onClick?: () => void
  reactions?: Record<string, number>
  myReactions?: string[]
  onReact?: (emoji: string) => void
}

function getArticleColor(term: string, isSingular: boolean): string {
  const trimmedTerm = term.trim().toLowerCase()
  if (trimmedTerm.startsWith('der ')) return 'bg-blue-100 text-blue-700'
  if (trimmedTerm.startsWith('das ')) return 'bg-green-100 text-green-700'
  if (trimmedTerm.startsWith('die ')) return isSingular ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
  return ''
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
  word,
  isLiked,
  onClick,
  reactions,
  myReactions,
  onReact,
}: PostCardProps) {
  const isMine = currentUserId !== undefined && author.id === currentUserId
  const [wordFlipped, setWordFlipped] = useState(false)
  
  return (
    <div className={`card group hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 w-full ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {/* Author Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-sky-100 rounded-xl flex items-center justify-center">
            <span className="text-lg">🐺</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm sm:text-base">
              {author.username}
              {author.is_premium && author.premium_status && (
                <span className="text-sm ml-0.5">{author.premium_status}</span>
              )}
            </p>
            <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-500 flex-wrap">
              <LevelBadge level={author.level} />
              <span className="hidden sm:inline">·</span>
              <span>{author.city || '—'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 sm:ml-auto" onClick={(e) => e.stopPropagation()}>
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

      {text && (
        <p className="text-slate-700 mb-3 sm:mb-4 whitespace-pre-wrap leading-relaxed text-sm sm:text-base line-clamp-3">
          {text}
        </p>
      )}

      {word && (
        <div
          className="relative cursor-pointer select-none mb-3 sm:mb-4"
          onClick={(e) => { e.stopPropagation(); setWordFlipped((f) => !f); }}
        >
          <div className="bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-100 rounded-xl p-3 sm:p-4 text-center transition-all duration-200 hover:shadow-md">
            {!wordFlipped ? (
              <>
                <p className="text-xs text-indigo-400 font-medium mb-1">Vocabulary</p>
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  {word.term.split(' ')[0] && (
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${getArticleColor(word.term, word.is_singular !== false)}`}>
                      {word.term.split(' ')[0]}
                    </span>
                  )}
                  <span className="ml-1">{word.term.split(' ').slice(1).join(' ')}</span>
                </p>
                <p className="text-[10px] text-indigo-400 mt-1">Tap to reveal meaning</p>
              </>
            ) : (
              <>
                <p className="text-xs text-indigo-400 font-medium mb-1">Meaning</p>
                <p className="text-base sm:text-lg font-semibold text-indigo-700">{word.meaning}</p>
                {word.note && <p className="text-xs text-slate-500 mt-1">{word.note}</p>}
              </>
            )}
          </div>
        </div>
      )}

      {/* Post Actions */}
        <div className="flex flex-row items-center justify-between gap-2 pt-2 sm:pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            className="flex items-center gap-1 sm:gap-1.5 text-slate-600 hover:text-red-500 transition-colors group"
            onClick={onLike}
          >
            <div className={`p-1.5 sm:p-2 rounded-xl transition-colors ${isLiked ? 'bg-red-50' : 'bg-slate-100 group-hover:bg-red-50'}`}>
              <Heart size={16} className={`sm:hidden ${isLiked ? 'fill-red-500 text-red-500' : 'group-hover:fill-red-500'}`} /><Heart size={18} className={`hidden sm:inline ${isLiked ? 'fill-red-500 text-red-500' : 'group-hover:fill-red-500'}`} />
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
        
        <div className="shrink-0">
          <TypeBadge type={type} />
        </div>
      </div>

      {(onReact || (reactions && Object.keys(reactions).length > 0)) && (
        <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-slate-100">
          {reactions && Object.entries(reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all border ${
                myReactions?.includes(emoji)
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-yellow-300 hover:bg-yellow-50'
              }`}
              onClick={() => onReact?.(emoji)}
              disabled={!onReact}
            >
              <span>{emoji}</span>
              <span className="text-xs font-semibold">{count}</span>
            </button>
          ))}
          {onReact && <ReactionPicker onReact={onReact} />}
        </div>
      )}

      {timestamp && (
        <p className="text-xs text-slate-400 mt-2 sm:mt-3">{timestamp}</p>
      )}
    </div>
  )
}
