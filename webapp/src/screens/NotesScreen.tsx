import { useState, useEffect, useRef } from 'react'
import { listStickyNotes, createStickyNote, updateStickyNote, deleteStickyNote, logActivity, type StickyNote, type User } from '../hooks/useApi'
import { Plus, Pin, Trash2, Bell, Check, Edit3 } from 'lucide-react'
import { useLevelUp } from '../contexts/LevelUpContext'

const COLOR_CONFIG: Record<string, { bg: string; border: string; dot: string }> = {
  yellow: { bg: 'bg-yellow-50',  border: 'border-yellow-200', dot: 'bg-yellow-400' },
  blue:   { bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-400'   },
  green:  { bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-400'  },
  pink:   { bg: 'bg-pink-50',    border: 'border-pink-200',   dot: 'bg-pink-400'   },
  purple: { bg: 'bg-purple-50',  border: 'border-purple-200', dot: 'bg-purple-400' },
}

interface NoteCardProps {
  note: StickyNote
  userId: number
  onUpdate: (note: StickyNote) => void
  onDelete: (noteId: number) => void
}

function NoteCard({ note, userId, onUpdate, onDelete }: NoteCardProps) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(note.content)
  const [title, setTitle] = useState(note.title || '')
  const [saving, setSaving] = useState(false)

  const cfg = COLOR_CONFIG[note.color] || COLOR_CONFIG.yellow

  const save = async () => {
    if (content.trim() === note.content && title === (note.title || '')) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      const updated = await updateStickyNote(note.id, userId, {
        content: content.trim(),
        title: title.trim() || undefined,
      })
      onUpdate(updated)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const togglePin = async () => {
    const updated = await updateStickyNote(note.id, userId, { is_pinned: !note.is_pinned })
    onUpdate(updated)
  }

  const changeColor = async (color: string) => {
    const updated = await updateStickyNote(note.id, userId, { color })
    onUpdate(updated)
  }

  return (
    <div className={`rounded-2xl border-2 ${cfg.bg} ${cfg.border} p-4 flex flex-col gap-2 relative group`}>
      {note.is_pinned && (
        <div className="absolute -top-2 left-4">
          <Pin size={14} className="text-slate-500 fill-slate-500" />
        </div>
      )}

      {note.reminder_at && !note.reminder_sent && (
        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-0.5 w-fit">
          <Bell size={10} />
          {new Date(note.reminder_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {editing ? (
        <input
          className="bg-transparent font-semibold text-slate-900 outline-none border-b border-slate-300 text-sm w-full"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
        />
      ) : (
        note.title && <p className="font-semibold text-slate-900 text-sm">{note.title}</p>
      )}

      {editing ? (
        <textarea
          className="bg-transparent text-slate-800 text-sm outline-none resize-none w-full min-h-[80px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={save}
          autoFocus
        />
      ) : (
        <p className="text-slate-800 text-sm whitespace-pre-wrap">{note.content}</p>
      )}

      <p className="text-[10px] text-slate-400 mt-auto">
        {new Date(note.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
      </p>

      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex gap-1.5">
          {Object.entries(COLOR_CONFIG).map(([color, c]) => (
            <button
              key={color}
              className={`w-4 h-4 rounded-full ${c.dot} ${note.color === color ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
              onClick={() => changeColor(color)}
              title={color}
            />
          ))}
        </div>

        <div className="flex gap-1">
          {editing ? (
            <>
              <button
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={() => { setEditing(false); setContent(note.content); setTitle(note.title || '') }}
              >
                <Trash2 size={13} />
              </button>
              <button
                className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={save}
                disabled={saving}
              >
                <Check size={13} />
              </button>
            </>
          ) : (
            <>
              <button
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                onClick={() => setEditing(true)}
                title="Edit"
              >
                <Edit3 size={13} />
              </button>
              <button
                className={`p-1.5 rounded-lg transition-colors ${note.is_pinned ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                onClick={togglePin}
                title={note.is_pinned ? 'Unpin' : 'Pin'}
              >
                <Pin size={13} />
              </button>
              <button
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                onClick={() => onDelete(note.id)}
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


interface NotesScreenProps {
  user: User
}

export default function NotesScreen({ user }: NotesScreenProps) {
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState<string>('yellow')
  const [newReminder, setNewReminder] = useState('')
  const [search, setSearch] = useState('')
  const { reportLevelUp } = useLevelUp()

  useEffect(() => {
    setLoading(true)
    listStickyNotes(user.id)
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user.id])

  const handleCreate = async () => {
    if (!newContent.trim()) return
    try {
      const note = await createStickyNote({
        user_id: user.id,
        content: newContent.trim(),
        title: newTitle.trim() || undefined,
        color: newColor,
        reminder_at: newReminder || undefined,
      })
      setNotes(prev => [note, ...prev])
      setNewContent('')
      setNewTitle('')
      setNewColor('yellow')
      setNewReminder('')
      setCreating(false)
      const result = await logActivity(user.id, 'note')
      if (result.leveled_up) reportLevelUp(result)
    } catch (err) {
      console.error('Failed to create note:', err)
    }
  }

  const handleUpdate = (updated: StickyNote) => {
    setNotes(prev =>
      prev.map(n => n.id === updated.id ? updated : n)
          .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned))
    )
  }

  const handleDelete = async (noteId: number) => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    await deleteStickyNote(noteId, user.id)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  const filteredNotes = notes.filter(n =>
    !search || n.content.toLowerCase().includes(search.toLowerCase()) ||
    (n.title || '').toLowerCase().includes(search.toLowerCase())
  )
  const pinned = filteredNotes.filter(n => n.is_pinned)
  const unpinned = filteredNotes.filter(n => !n.is_pinned)

  return (
    <div className="space-y-4 p-3 sm:p-0 animate-qaw-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Notes</h2>
        <button
          className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4"
          onClick={() => setCreating(true)}
        >
          <Plus size={16} /> New note
        </button>
      </div>

      <input
        className="input-primary text-sm"
        placeholder="Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {creating && (
        <div className="card space-y-3 border-2 border-indigo-200 bg-indigo-50">
          <input
            className="input-primary text-sm"
            placeholder="Title (optional)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            className="w-full input-primary text-sm resize-none"
            placeholder="Write your note..."
            rows={4}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            autoFocus
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {Object.entries(COLOR_CONFIG).map(([color, c]) => (
                <button
                  key={color}
                  className={`w-5 h-5 rounded-full ${c.dot} ${newColor === color ? 'ring-2 ring-offset-1 ring-slate-500' : ''}`}
                  onClick={() => setNewColor(color)}
                />
              ))}
            </div>
            <input
              type="datetime-local"
              className="input-primary text-xs py-1.5 w-full sm:flex-1 sm:min-w-0"
              value={newReminder}
              onChange={(e) => setNewReminder(e.target.value)}
              title="Set reminder"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary text-sm" onClick={() => { setCreating(false); setNewContent(''); setNewTitle('') }}>
              Cancel
            </button>
            <button
              className="btn-primary text-sm disabled:opacity-50"
              onClick={handleCreate}
              disabled={!newContent.trim()}
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Loading notes...</p>}

      {!loading && notes.length === 0 && !creating && (
        <div className="text-center py-12 space-y-2">
          <p className="text-5xl">📝</p>
          <p className="text-slate-600 font-medium">No notes yet</p>
          <p className="text-sm text-slate-400">Write down vocabulary tips, grammar rules, or anything worth remembering</p>
        </div>
      )}

      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Pinned</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pinned.map(note => (
              <NoteCard key={note.id} note={note} userId={user.id} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-4">All Notes</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unpinned.map(note => (
              <NoteCard key={note.id} note={note} userId={user.id} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
