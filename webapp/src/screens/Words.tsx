import { useEffect, useState } from 'react'
import { listWordsFeed, User } from '../hooks/useApi'

export function Words({ user }: { user: User }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    listWordsFeed()
      .then((data) => setItems(data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Words</h2>
        {loading && <span className="text-xs text-slate-500">Loading...</span>}
      </div>
      {items.map((w) => (
        <div key={w.id} className="card space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{w.user?.username || 'User'}</p>
              <p className="text-xs text-slate-500">{w.user?.city || '—'} · {w.user?.level || ''}</p>
            </div>
            <span className="text-[11px] text-slate-500">{new Date(w.created_at).toLocaleDateString()}</span>
          </div>
          <p className="text-lg font-semibold">{w.term}</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{w.meaning}</p>
          {w.note && <p className="text-xs text-slate-500 whitespace-pre-wrap">{w.note}</p>}
        </div>
      ))}
      {items.length === 0 && !loading && <p className="text-sm text-slate-500">No words yet.</p>}
    </div>
  )
}
