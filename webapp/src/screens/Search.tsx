import { useState } from 'react'
import { searchUsers } from '../hooks/useApi'

export function Search() {
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('')
  const [results, setResults] = useState<any[]>([])

  const run = async () => {
    const data = await searchUsers(q, level)
    setResults(data.results || [])
  }

  return (
    <div className="card space-y-3">
      <div className="flex gap-2">
        <input className="border rounded-lg p-3 flex-1" placeholder="Search city or username" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="border rounded-lg p-2" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">Any level</option>
          {['A1','A2','B1','B2','C1'].map(l => <option key={l}>{l}</option>)}
        </select>
        <button className="btn-primary" onClick={run}>Go</button>
      </div>
      <div className="space-y-2">
        {results.map((u) => (
          <div key={u.id} className="flex items-center justify-between border rounded-xl p-3">
            <div>
              <p className="font-semibold">{u.username}</p>
              <p className="text-xs text-slate-500">
                {u.city || '—'} · {u.level}{u.age ? ` · ${u.age} years old` : ''}
              </p>
            </div>
            <span className={`level-badge level-${(u.level || '').toLowerCase()}`}>{u.level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
