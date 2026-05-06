import { useEffect, useState, useCallback } from 'react'
import { listWordsFeed, listWords, createWord, saveWord, deleteWord, createQuiz, listQuizzes, User, Quiz, listWordFolders, createWordFolder, updateWordFolder, deleteWordFolder, reorderWordFolders, WordFolder, listWordsByFolder, fetchWordOfTheDay } from '../hooks/useApi'
import { Plus, X, BookOpen, Globe, Trash2, Bookmark, ArrowLeft, RotateCcw, History, Trophy, Folder, FolderPlus, Edit2, Check, MoreVertical, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react'

// Helper function to get article color based on term and singular/plural
function getArticleColor(term: string, isSingular: boolean): string {
  const trimmedTerm = term.trim().toLowerCase()
  
  if (trimmedTerm.startsWith('der ')) return 'bg-blue-100 text-blue-700'
  if (trimmedTerm.startsWith('das ')) return 'bg-green-100 text-green-700'
  if (trimmedTerm.startsWith('die ')) {
    return isSingular ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
  }
  return 'bg-slate-100 text-black' // Default black label when no article
}

// Function to get article info for display
function getWordArticleInfo(term: string, isSingular: boolean = true): { color: string; article: string } {
  const trimmedTerm = term.trim()
  const firstWord = trimmedTerm.split(' ')[0]?.toLowerCase() || ''
  
  if (firstWord === 'der') return { color: 'bg-blue-100 text-blue-700', article: 'der' }
  if (firstWord === 'das') return { color: 'bg-green-100 text-green-700', article: 'das' }
  if (firstWord === 'die') {
    return isSingular 
      ? { color: 'bg-red-100 text-red-700', article: 'die (singular)' }
      : { color: 'bg-gray-100 text-gray-700', article: 'die (plural)' }
  }
  return { color: 'bg-slate-100 text-black', article: '—' } // Default black when no article
}

type Word = {
  id: number
  term: string
  meaning: string
  note?: string
  saved_from_id?: number
  created_at: string
  user_id: number
  user?: { id: number; username: string; level?: string; city?: string }
  is_singular?: boolean
  folder_id?: number | null
}

type FolderWithWords = {
  folder: WordFolder
  words: Word[]
}

// ─── Add Word Form ────────────────────────────────────────────────
function AddWordForm({ userId, onAdded, folders, onCreateFolder }: { userId: number; onAdded: (w: Word) => void; folders: WordFolder[]; onCreateFolder: () => void }) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [meaning, setMeaning] = useState('')
  const [note, setNote] = useState('')
  const [isSingular, setIsSingular] = useState(true)
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false)

  const submit = async () => {
    if (!term.trim() || !meaning.trim()) return
    setLoading(true)
    try {
      const w = await createWord({ 
        user_id: userId, 
        term: term.trim(), 
        meaning: meaning.trim(), 
        note: note.trim() || undefined, 
        is_singular: isSingular,
        folder_id: selectedFolderId || undefined
      })
      onAdded(w)
      setTerm('')
      setMeaning('')
      setNote('')
      setIsSingular(true)
      setSelectedFolderId(null)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 md:py-4"
        onClick={() => setOpen(true)}
      >
        <Plus size={18} className="md:size-5" />
        <span className="text-sm md:text-base">Add New Word</span>
      </button>
    )
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-sm md:text-base">New Word</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white transition-colors">
          <X size={18} className="md:size-5" />
        </button>
      </div>
      <input
        className="input-primary text-sm md:text-base"
        placeholder="German word (e.g. der Hund)"
        value={term}
        autoFocus
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <input
        className="input-primary text-sm md:text-base"
        placeholder="Meaning (e.g. the dog)"
        value={meaning}
        onChange={(e) => setMeaning(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <textarea
        className="input-primary resize-none text-sm md:text-base"
        placeholder="Your note (optional)"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex items-center gap-3 py-1">
        <span className={`text-sm font-medium ${isSingular ? 'text-indigo-600' : 'text-slate-400'}`}>Singular</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={!isSingular}
            onChange={(e) => setIsSingular(!e.target.checked)}
          />
          <div className="w-11 h-6 bg-slate-200 peer-checked:bg-indigo-500 rounded-full transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-md after:transition-transform after:duration-200 peer-checked:after:translate-x-full"></div>
        </label>
        <span className={`text-sm font-medium ${!isSingular ? 'text-indigo-600' : 'text-slate-400'}`}>Plural</span>
      </div>
      <div className="relative">
        <button
          className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white text-left hover:border-indigo-300 transition-colors"
          onClick={() => setFolderDropdownOpen(!folderDropdownOpen)}
        >
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-slate-400" />
            <span className="text-slate-700">
              {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : 'No folder (Uncategorized)'}
            </span>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
        {folderDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-qaw-fade-in-up">
            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
              onClick={() => {
                setSelectedFolderId(null)
                setFolderDropdownOpen(false)
              }}
            >
              <Folder size={16} className="text-slate-400 ml-1" />
              <span>No folder (Uncategorized)</span>
            </button>
            {folders.length > 0 && (
              <>
                <div className="px-4 py-1 bg-slate-50 text-xs text-slate-500">Your Folders</div>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      setSelectedFolderId(folder.id)
                      setFolderDropdownOpen(false)
                    }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }} />
                    <span>{folder.name}</span>
                  </button>
                ))}
              </>
            )}
            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 transition-colors"
              onClick={() => {
                setFolderDropdownOpen(false)
                onCreateFolder()
              }}
            >
              <FolderPlus size={16} />
              <span>Create New Folder</span>
            </button>
          </div>
        )}
      </div>
      <button
        className="btn-primary w-full disabled:opacity-50"
        onClick={submit}
        disabled={loading || !term.trim() || !meaning.trim()}
      >
        {loading ? 'Adding...' : 'Save Word'}
      </button>
    </div>
  )
}

// ─── Folder Manager Modal ────────────────────────────────────────
function FolderManagerModal({
  userId,
  folders,
  isOpen,
  onClose,
  onFoldersUpdated,
}: {
  userId: number
  folders: WordFolder[]
  isOpen: boolean
  onClose: () => void
  onFoldersUpdated: () => void
}) {
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#6366f1')
  const [editingFolder, setEditingFolder] = useState<WordFolder | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#6366f1')
  const [loading, setLoading] = useState(false)
  const [draggedFolder, setDraggedFolder] = useState<number | null>(null)

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
  ]

  if (!isOpen) return null

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    setLoading(true)
    try {
      await createWordFolder({ user_id: userId, name: newFolderName.trim(), color: newFolderColor })
      setNewFolderName('')
      setNewFolderColor('#6366f1')
      onFoldersUpdated()
    } finally {
      setLoading(false)
    }
  }

  const updateFolder = async () => {
    if (!editingFolder || !editName.trim()) return
    setLoading(true)
    try {
      await updateWordFolder(editingFolder.id, { name: editName.trim(), color: editColor })
      setEditingFolder(null)
      setEditName('')
      setEditColor('#6366f1')
      onFoldersUpdated()
    } finally {
      setLoading(false)
    }
  }

  const deleteFolder = async (folderId: number) => {
    if (!window.confirm('Are you sure you want to delete this folder? Words will be moved to uncategorized.')) return
    setLoading(true)
    try {
      await deleteWordFolder(folderId, userId)
      onFoldersUpdated()
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async () => {
    // This would need drag and drop implementation
    onFoldersUpdated()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-qaw-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Manage Folders</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Create New Folder */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-slate-900 mb-3">Create New Folder</h3>
          <div className="flex gap-2">
            <input
              className="flex-1 input-primary"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
            />
            <div className="relative">
              <button
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-indigo-300"
                style={{ backgroundColor: newFolderColor }}
                onClick={() => setNewFolderColor(newFolderColor === colors[0] ? colors[1] : colors[0])}
              />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border border-slate-200" style={{ backgroundColor: newFolderColor }} />
            </div>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              onClick={createFolder}
              disabled={!newFolderName.trim() || loading}
            >
              Create
            </button>
          </div>
        </div>

        {/* Existing Folders */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Your Folders ({folders.length})</h3>
          {folders.length === 0 && (
            <p className="text-slate-500 text-center py-4">No folders yet. Create your first folder above!</p>
          )}
          {folders.map((folder) => (
            <div key={folder.id} className="bg-slate-50 rounded-xl p-4">
              {editingFolder?.id === folder.id ? (
                <div className="flex gap-2">
                  <input
                    className="flex-1 input-primary text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateFolder()}
                  />
                  <div className="w-6 h-6 rounded-lg cursor-pointer" style={{ backgroundColor: editColor }} onClick={() => setEditColor(editColor === colors[0] ? colors[1] : colors[0])} />
                  <button
                    className="p-1 text-green-600 hover:bg-green-50 rounded-lg"
                    onClick={updateFolder}
                    disabled={!editName.trim()}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
                    onClick={() => {
                      setEditingFolder(null)
                      setEditName('')
                      setEditColor('#6366f1')
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: folder.color || '#6366f1' }} />
                    <span className="font-medium text-slate-900">{folder.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      onClick={() => {
                        setEditingFolder(folder)
                        setEditName(folder.name)
                        setEditColor(folder.color || '#6366f1')
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      onClick={() => deleteFolder(folder.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Word Card ────────────────────────────────────────────────────
function WordCard({
  word,
  isMine,
  onDelete,
  onSave,
  alreadySaved,
  compact,
}: {
  word: Word
  isMine: boolean
  onDelete?: () => void
  onSave?: () => void
  alreadySaved?: boolean
  compact?: boolean
}) {
  const [flipped, setFlipped] = useState(false)

  if (compact) {
    return (
      <div
        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setFlipped((f) => !f)}
        >
          {!flipped ? (
            <>
              <p className="font-semibold text-slate-900 text-lg truncate">
                {(() => {
                  const { article, color } = getWordArticleInfo(word.term, word.is_singular !== false)
                  return article ? (
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold border ${color}`}>
                      {article}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded-lg text-xs font-bold border border-slate-300 text-slate-700">
                      —
                    </span>
                  )
                })()}
                <span className="ml-1">{word.term.split(' ').slice(1).join(' ')}</span>
              </p>
              {word.note && <p className="text-xs text-slate-400 mt-0.5 truncate">{word.note}</p>}
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-indigo-700">{word.meaning}</p>
              {word.note && <p className="text-xs text-slate-400 mt-0.5 truncate">{word.note}</p>}
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
          {isMine && onDelete && (
            <button
              className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              onClick={onDelete}
              title="Delete word"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="card group hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200 cursor-pointer select-none touch-manipulation"
      onClick={() => setFlipped((f) => !f)}
    >
      <div className="flex flex-col py-2">
        <div className="text-center">
          {!flipped ? (
            <>
              <p className="text-2xl font-bold text-slate-900">
                {word.term.split(' ')[0] && (
                  <span className={`inline-block px-2 py-1 rounded-lg text-base font-bold ${getArticleColor(word.term, word.is_singular !== false)}`}>
                    {word.term.split(' ')[0]}
                  </span>
                )}
                <span className="ml-1">{word.term.split(' ').slice(1).join(' ')}</span>
              </p>
              <p className="text-xs text-indigo-400 mt-2 font-medium">Tap to reveal</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-semibold text-indigo-700">{word.meaning}</p>
              {word.note && <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">{word.note}</p>}
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {!isMine && word.user && (
              <p className="text-xs text-slate-400">by {word.user.username}</p>
            )}
            {word.saved_from_id && (
              <p className="text-xs text-indigo-300">Saved from community</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isMine && onSave && (
              <button
                className={`p-1.5 rounded-lg transition-colors ${
                  alreadySaved
                    ? 'text-indigo-400 bg-indigo-50 cursor-default'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
                onClick={alreadySaved ? undefined : onSave}
                title={alreadySaved ? 'Already saved' : 'Save to my words'}
              >
                <Bookmark size={14} className={alreadySaved ? 'fill-indigo-400' : ''} />
              </button>
            )}
            {isMine && onDelete && (
              <button
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                onClick={onDelete}
                title="Delete word"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Quiz Mode ────────────────────────────────────────────────────
function QuizMode({ words, onExit, user }: { words: Word[]; onExit: () => void; user: User }) {
  const [deck] = useState(() => [...words].sort(() => Math.random() - 0.5))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const current = deck[index]

  const answer = (correct: boolean) => {
    if (correct) setKnown((k) => k + 1)
    const nextIndex = index + 1
    if (nextIndex >= deck.length) {
      setDone(true)
      // Save quiz result with the final count
      saveQuizResult(correct ? known + 1 : known)
    } else {
      setIndex(nextIndex)
      setFlipped(false)
    }
  }

  const saveQuizResult = async (finalKnown: number) => {
    try {
      setSaving(true)
      await createQuiz({
        user_id: user.id,
        total_questions: deck.length,
        correct_answers: finalKnown,
        score_percentage: Math.round((finalKnown / deck.length) * 100),
        word_ids: deck.map(w => w.id),
      })
    } catch (e) {
      console.error('Failed to save quiz result:', e)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    const pct = Math.round((known / deck.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="text-6xl">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
        <h2 className="text-2xl font-bold text-slate-900">Quiz Complete!</h2>
        <p className="text-slate-600">
          You knew <span className="text-indigo-600 font-bold">{known}</span> out of <span className="font-bold">{deck.length}</span> words
        </p>
        <div className="w-full max-w-xs bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-lg font-bold text-indigo-600">{pct}%</p>
        <button className="btn-primary flex items-center gap-2" onClick={onExit}>
          <ArrowLeft size={16} /> Back to Words
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm" onClick={onExit}>
          <ArrowLeft size={16} /> Exit Quiz
        </button>
        <span className="text-sm text-slate-500">{index + 1} / {deck.length}</span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${(index / deck.length) * 100}%` }}
        />
      </div>

      <div
        className="card min-h-[180px] flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-lg transition-all duration-200 select-none"
        onClick={() => setFlipped(true)}
      >
        {!flipped ? (
          <>
            <p className="text-3xl font-bold text-slate-900 mb-3">
              <span className={`inline-block px-2 py-1 rounded-lg text-lg font-bold ${getArticleColor(current.term, current.is_singular !== false)}`}>
                {current.term.split(' ')[0]}
              </span>
              <span className="ml-1">{current.term.split(' ').slice(1).join(' ')}</span>
            </p>
            <p className="text-sm text-indigo-400">Tap to reveal</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold text-indigo-700 mb-2">{current.meaning}</p>
            {current.note && <p className="text-sm text-slate-500">{current.note}</p>}
          </>
        )}
      </div>

      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button
            className="py-3 px-4 rounded-2xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors border border-red-100"
            onClick={() => answer(false)}
          >
            ❌ Still learning
          </button>
          <button
            className="py-3 px-4 rounded-2xl bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-colors border border-green-100"
            onClick={() => answer(true)}
          >
            ✅ Know it!
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Quiz History Card ────────────────────────────────────────────
function QuizHistoryCard({ quiz }: { quiz: Quiz }) {
  const date = new Date(quiz.created_at)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="card flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
          <Trophy size={24} className="text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{quiz.score_percentage}% Score</p>
          <p className="text-xs text-slate-500">{quiz.correct_answers}/{quiz.total_questions} correct</p>
          <p className="text-xs text-slate-400 mt-0.5">{dateStr} at {timeStr}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {quiz.word_ids?.length && (
          <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full font-medium">
            {quiz.word_ids.length} words
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Words Screen ────────────────────────────────────────────
export function Words({ user, onUserUpdated }: { user: User; onUserUpdated?: () => void }) {
  const [tab, setTab] = useState<'mine' | 'community' | 'history'>('mine')
  const [myWords, setMyWords] = useState<Word[]>([])
  const [communityWords, setCommunityWords] = useState<Word[]>([])
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [wordOfDay, setWordOfDay] = useState<Word | null>(null)
  const [loading, setLoading] = useState(false)
  const [quizMode, setQuizMode] = useState(false)
  const [quizHistory, setQuizHistory] = useState<Quiz[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [folders, setFolders] = useState<WordFolder[]>([])
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [wordsByFolder, setWordsByFolder] = useState<{ uncategorized: Word[]; folders: Record<number, { folder: WordFolder; words: Word[] }> } | null>(null)

  const loadMyWords = useCallback(async () => {
    setLoading(true)
    const data = await listWords(user.id)
    setMyWords(data || [])
    const saved = new Set<number>(
      (data || [])
        .filter((w: Word) => w.saved_from_id)
        .map((w: Word) => w.saved_from_id as number)
    )
    setSavedIds(saved)
    setLoading(false)
  }, [user.id])

  const loadWordsByFolder = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listWordsByFolder(user.id)
      setWordsByFolder(data)
      
      // Also load folders to get their details
      const foldersData = await listWordFolders(user.id)
      setFolders(foldersData || [])
      
      // Update myWords for quiz functionality
      const allWords: Word[] = []
      if (data?.uncategorized) allWords.push(...data.uncategorized)
      if (data?.folders) {
        Object.values(data.folders as Record<number, { folder: any; words: Word[] }>).forEach(f => allWords.push(...f.words))
      }
      setMyWords(allWords)
      
      const saved = new Set<number>(
        allWords
          .filter((w: Word) => w.saved_from_id)
          .map((w: Word) => w.saved_from_id as number)
      )
      setSavedIds(saved)
    } catch (error) {
      console.error('Failed to load words by folder:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  // Helper function to get folder by ID
  const getFolderById = (folderId: number) => {
    return folders.find(f => f.id === folderId)
  }

  const loadCommunityWords = useCallback(async () => {
    setLoading(true)
    const data = await listWordsFeed(50)
    setCommunityWords((data || []).filter((w: Word) => w.user_id !== user.id))
    setLoading(false)
  }, [user.id])

  const loadQuizHistory = useCallback(async () => {
    setLoadingHistory(true)
    const data = await listQuizzes(user.id, 50)
    setQuizHistory(data || [])
    setLoadingHistory(false)
  }, [user.id])

  const loadFolders = useCallback(async () => {
    const data = await listWordFolders(user.id)
    setFolders(data || [])
  }, [user.id])

  useEffect(() => {
    loadWordsByFolder()
  }, [loadWordsByFolder])

  useEffect(() => {
    if (tab === 'community') {
      loadCommunityWords()
      fetchWordOfTheDay().then(setWordOfDay).catch(() => {})
    }
    if (tab === 'history') loadQuizHistory()
  }, [tab, loadCommunityWords, loadQuizHistory])

  const handleAdded = (w: Word) => {
    setMyWords((prev) => [w, ...prev])
    onUserUpdated?.()
  }

  const handleDelete = async (wordId: number) => {
    await deleteWord(wordId, user.id)
    setMyWords((prev) => prev.filter((w) => w.id !== wordId))
  }

  const handleSave = async (word: Word) => {
    try {
      const saved = await saveWord(word.id, user.id)
      setMyWords((prev) => [saved, ...prev])
      setSavedIds((prev) => new Set([...prev, word.id]))
    } catch {
      // already saved — ignore
    }
  }

  if (quizMode) {
    return <QuizMode words={myWords} onExit={() => setQuizMode(false)} user={user} />
  }

  return (
    <div className="space-y-3 md:space-y-4 px-1 sm:px-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold text-slate-900">Words</h2>
        {loading && <span className="text-xs text-slate-400">Loading...</span>}
      </div>

      {/* Tabs - Responsive */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
        <button
          className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'mine' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setTab('mine')}
        >
          <BookOpen size={15} className="md:size-5" />
          <span className="hidden sm:inline">My Words</span>
          {myWords.length > 0 && (
            <span className="ml-1 bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
              {myWords.length}
            </span>
          )}
        </button>
        <button
          className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'community' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setTab('community')}
        >
          <Globe size={15} className="md:size-5" />
          <span className="hidden sm:inline">Community</span>
        </button>
        <button
          className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setTab('history')}
        >
          <History size={15} className="md:size-5" />
          <span className="hidden sm:inline">Quiz History</span>
          {quizHistory.length > 0 && (
            <span className="ml-1 bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
              {quizHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* My Words Tab */}
      {tab === 'mine' && (
        <div className="space-y-3">
          <AddWordForm userId={user.id} onAdded={handleAdded} folders={folders} onCreateFolder={() => setFolderModalOpen(true)} />

          {myWords.length >= 3 && (
            <button
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md shadow-indigo-200"
              onClick={() => setQuizMode(true)}
            >
              🧠 Start Flashcard Quiz ({myWords.length} words)
            </button>
          )}

          {myWords.length === 0 && !loading && (
            <div className="text-center py-10 space-y-2">
              <p className="text-4xl">📖</p>
              <p className="text-slate-500 font-medium">No words yet</p>
              <p className="text-sm text-slate-400">Add your first word above or save from Community</p>
            </div>
          )}

          {myWords.map((w) => (
            <WordCard
              key={w.id}
              word={w}
              isMine={true}
              onDelete={() => handleDelete(w.id)}
              compact
            />
          ))}
        </div>
      )}

      {/* Community Tab */}
      {tab === 'community' && (
        <div className="space-y-3">
          {wordOfDay && wordOfDay.user_id !== user.id && (
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white mb-2">
              <p className="text-xs font-semibold opacity-75 mb-1 uppercase tracking-wide">⭐ Word of the Day</p>
              <p className="text-2xl font-bold">{wordOfDay.term}</p>
              <p className="text-indigo-200 mt-1">{wordOfDay.meaning}</p>
              {!savedIds.has(wordOfDay.id) ? (
                <button
                  className="mt-3 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                  onClick={() => handleSave(wordOfDay)}
                >
                  + Save to my words
                </button>
              ) : (
                <p className="mt-3 text-indigo-200 text-sm">✓ Saved</p>
              )}
            </div>
          )}
          {communityWords.length === 0 && !loading && (
            <div className="text-center py-10 space-y-2">
              <p className="text-4xl">🌍</p>
              <p className="text-slate-500 font-medium">No community words yet</p>
              <p className="text-sm text-slate-400">Be the first to share a word!</p>
            </div>
          )}
          {communityWords.map((w) => (
            <WordCard
              key={w.id}
              word={w}
              isMine={false}
              onSave={() => handleSave(w)}
              alreadySaved={savedIds.has(w.id)}
            />
          ))}
        </div>
      )}

      {/* Quiz History Tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {loadingHistory ? (
            <div className="text-center py-10">
              <p className="text-slate-500">Loading quiz history...</p>
            </div>
          ) : quizHistory.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-4xl">📊</p>
              <p className="text-slate-500 font-medium">No quizzes taken yet</p>
              <p className="text-sm text-slate-400">Complete a quiz to see your history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizHistory.map((quiz) => (
                <QuizHistoryCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          )}
        </div>
      )}
      <FolderManagerModal
        userId={user.id}
        folders={folders}
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onFoldersUpdated={() => { loadFolders(); setFolderModalOpen(false) }}
      />
    </div>
  )
}