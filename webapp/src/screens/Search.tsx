import { useEffect, useState } from 'react'
import { searchUsers, getImageUrl } from '../hooks/useApi'
import type { User } from '../hooks/useApi'

interface SearchProps {
  onViewUser?: (userId: number) => void
}

export function Search({ onViewUser }: SearchProps) {
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!q.trim() && !level) return
    setLoading(true)
    try {
      const data = await searchUsers(q, level)
      setResults(data.results || [])
    } finally {
      setLoading(false)
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
        {results.map((u) => (
          <button
            key={u.id}
            className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded-xl p-3 text-left hover:bg-slate-50 transition-colors"
            onClick={() => onViewUser?.(u.id)}
          >
            <div className="flex items-center gap-3">
              {u.profile_photo ? (
                <img
                  src={getImageUrl(u.profile_photo)}
                  alt={u.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
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
            </div>
            <span className={`level-badge level-${(u.level || '').toLowerCase()} sm:hidden lg:inline`}>{u.level}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
