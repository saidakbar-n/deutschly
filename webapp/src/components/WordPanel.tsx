import { useEffect, useState } from 'react'
import { createWord, listWords, User } from '../hooks/useApi'

export function WordPanel({ user }: { user: User }) {
  const [words, setWords] = useState<any[]>([])
  const [term, setTerm] = useState('')
  const [meaning, setMeaning] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const data = await listWords(user.id)
    setWords(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!term.trim() || !meaning.trim()) return
    const w = await createWord({ user_id: user.id, term: term.trim(), meaning: meaning.trim(), note: note.trim() || undefined })
    setWords([w, ...words])
    setTerm('')
    setMeaning('')
    setNote('')
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Words</h3>
        {loading && <span className="text-xs text-slate-500">Loading...</span>}
      </div>
      <input className="border rounded-lg px-3 py-2" placeholder="Word" value={term} onChange={(e) => setTerm(e.target.value)} />
      <input className="border rounded-lg px-3 py-2" placeholder="Meaning" value={meaning} onChange={(e) => setMeaning(e.target.value)} />
      <textarea className="border rounded-lg px-3 py-2" placeholder="Your note (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn-primary w-full" onClick={add} disabled={!term.trim() || !meaning.trim()}>Add</button>
    </div>
  )
}
