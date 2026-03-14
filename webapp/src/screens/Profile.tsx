import { useState, useEffect } from 'react'
import { upsertProfile, UserProfile } from '../hooks/useApi'
import { useUserId } from '../hooks/useUserId'

export function Profile() {
  const userId = useUserId(0)
  const [form, setForm] = useState<UserProfile>({ telegram_id: userId, username: '', level: 'A1', city: '' })
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (userId) setForm((f) => ({ ...f, telegram_id: userId }))
  }, [userId])

  const handleChange = (k: keyof UserProfile, v: any) => setForm({ ...form, [k]: v })

  const save = async () => {
    setStatus('Saving...')
    await upsertProfile(form)
    setStatus('Saved')
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Profile</h3>
        <span className="text-xs text-slate-500">{status}</span>
      </div>
      <input className="border rounded-lg p-3" placeholder="Telegram ID" value={form.telegram_id || ''} onChange={(e) => handleChange('telegram_id', Number(e.target.value))} />
      <input className="border rounded-lg p-3" placeholder="Username" value={form.username} onChange={(e) => handleChange('username', e.target.value)} />
      <input className="border rounded-lg p-3" placeholder="City" value={form.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
      <select className="border rounded-lg p-3" value={form.level} onChange={(e) => handleChange('level', e.target.value)}>
        {['A1','A2','B1','B2','C1'].map(l => <option key={l}>{l}</option>)}
      </select>
      <button className="btn-primary w-full" onClick={save}>Save Profile</button>
    </div>
  )
}
