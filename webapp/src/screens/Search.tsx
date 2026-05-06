import { useEffect, useState } from 'react'
import { searchUsers, followUser, unfollowUser, listFollowing, getImageUrl } from '../hooks/useApi'
import type { User } from '../hooks/useApi'
import { UserPlus, UserCheck } from 'lucide-react'

interface SearchProps {
  user: User
  onViewUser?: (userId: number) => void
  onFollow?: (targetUserId: number) => Promise<void>
}

export function Search({ user, onViewUser, onFollow }: SearchProps) {
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState<number | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set())

  // Load following list on mount
  useEffect(() => {
    const loadFollowing = async () => {
      try {
        const data = await listFollowing(user.id)
        const followingList = data.following || []
        setFollowingIds(new Set(followingList.map((u: User) => u.id)))
      } catch (err) {
        console.error('Failed to load following:', err)
      }
    }
    loadFollowing()
  }, [user.id])

  const run = async () => {
    if (!q.trim() && !level) return
    setLoading(true)
    try {
      const data = await searchUsers(q, level)
      const filtered = (data.results || []).filter((u: User) => u.id !== user.id)
      setResults(filtered)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (targetUserId: number) => {
    setFollowLoading(targetUserId)
    try {
      const isCurrentlyFollowing = followingIds.has(targetUserId)
      if (isCurrentlyFollowing) {
        if (onFollow) {
          await onFollow(targetUserId)
        } else {
          await unfollowUser(targetUserId, user.id)
        }
        setFollowingIds(prev => {
          const next = new Set(prev)
          next.delete(targetUserId)
          return next
        })
      } else {
        if (onFollow) {
          await onFollow(targetUserId)
        } else {
          await followUser(targetUserId, user.id)
        }
        setFollowingIds(prev => new Set([...prev, targetUserId]))
      }
    } catch (err) {
      console.error('Follow/unfollow failed:', err)
    } finally {
      setFollowLoading(null)
    }
  }

  useEffect(() => {
    if (level) run()
  }, [level])

  return (
    <div className="card space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input 
          className="border rounded-lg p-3 sm:p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base" 
          placeholder="Search city or username" 
          value={q} 
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
        />
        <div className="flex gap-2">
          <select 
            className="border rounded-lg p-2 sm:p-2 flex-1 sm:flex-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base" 
            value={level} 
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="">Any level</option>
            {['A1','A2','B1','B2','C1'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button 
            className="btn-primary whitespace-nowrap px-4 py-2 sm:py-1 text-sm sm:text-base" 
            onClick={run}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      {loading && results.length === 0 && (
        <div className="text-center py-4">
          <p className="text-slate-500 text-sm">Searching...</p>
        </div>
      )}
      
      {results.length === 0 && !loading && q && (
        <div className="text-center py-6">
          <p className="text-slate-400 text-lg">🔍</p>
          <p className="text-slate-500 text-sm mt-2">No users found</p>
          <p className="text-xs text-slate-400 mt-1">Try a different search term or level</p>
        </div>
      )}
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {results.map((u) => {
          const isFollowing = followingIds.has(u.id)
          return (
            <div
              key={u.id}
              className="flex items-center justify-between border rounded-xl p-3 hover:bg-slate-50 transition-colors"
            >
              <button
                className="flex items-center gap-3 flex-1 text-left min-w-0"
                onClick={() => onViewUser?.(u.id)}
              >
                {u.profile_photo ? (
                  <img
                    src={getImageUrl(u.profile_photo)}
                    alt={u.username}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-sm">
                      {u.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{u.username}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {u.full_name || u.city || '—'} · 
                    <span className={`level-badge level-${(u.level || '').toLowerCase()}`}>{u.level}</span>
                    {u.age ? ` · ${u.age} years` : ''}
                  </p>
                </div>
              </button>
              <button
                className={`ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  isFollowing
                    ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                onClick={() => handleFollow(u.id)}
                disabled={followLoading === u.id}
              >
                {followLoading === u.id ? (
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserCheck size={14} />
                    <span className="hidden sm:inline">Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span className="hidden sm:inline">Follow</span>
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
