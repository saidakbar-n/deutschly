import { useState, useEffect, useMemo } from 'react'
import { searchUsers, createConversation, listFollowing, listConversations, getImageUrl, type User } from '../hooks/useApi'
import { X, Search, MessageCircle } from 'lucide-react'

interface NewChatModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onConversationCreated: (conversationId: number, otherUserId: number) => void
}

export function NewChatModal({ user, isOpen, onClose, onConversationCreated }: NewChatModalProps) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setQ('')
      setResults([])
      loadSuggestions()
    }
  }, [isOpen])

  const loadSuggestions = async () => {
    setSuggestionsLoading(true)
    try {
      const [followingData, conversations] = await Promise.all([
        listFollowing(user.id),
        listConversations(user.id),
      ])
      const following = (followingData.following || []).filter((u: User) => u.id !== user.id)
      const existingIds = new Set(conversations.map(c => c.other_user.id))
      setSuggestions(following.filter(u => !existingIds.has(u.id)))
    } catch (err) {
      console.error('Failed to load suggestions:', err)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const filteredSuggestions = useMemo(() => {
    if (!q.trim()) return suggestions
    const lower = q.toLowerCase()
    return suggestions.filter(u =>
      u.username.toLowerCase().includes(lower) ||
      (u.full_name || '').toLowerCase().includes(lower) ||
      (u.city || '').toLowerCase().includes(lower)
    )
  }, [q, suggestions])

  const handleSearch = async () => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const data = await searchUsers(q)
      const filtered = (data.results || []).filter((u: User) => u.id !== user.id)
      setResults(filtered)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (otherUserId: number) => {
    try {
      const conv = await createConversation(user.id, otherUserId)
      onConversationCreated(conv.id, otherUserId)
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  if (!isOpen) return null

  const showSuggestions = !q.trim() || results.length === 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">New Message</h2>
          <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search users..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              if (!e.target.value) setResults([])
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold" onClick={handleSearch} disabled={loading}>
            <Search size={16} />
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {suggestionsLoading ? (
            <div className="text-center py-4 text-slate-500 text-sm">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading suggestions...
            </div>
          ) : showSuggestions && filteredSuggestions.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">
                {q.trim() ? 'Matching followed users' : 'Your followed users'}
              </p>
              {filteredSuggestions.map((u) => (
                <button
                  key={u.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors"
                  onClick={() => handleSelect(u.id)}
                >
                  {u.profile_photo ? (
                    <img src={getImageUrl(u.profile_photo)} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-sm">{u.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      {u.username}
                      {suggestions.some(s => s.id === u.id) && (
                        <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full font-medium">Following</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{u.full_name || u.city || 'German Learner'} · <span className={`level-badge level-${(u.level || '').toLowerCase()}`}>{u.level}</span></p>
                  </div>
                  <MessageCircle size={16} className="text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </>
          ) : null}

          {loading ? (
            <div className="text-center py-4 text-slate-500 text-sm">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">Search results</p>
              {results.map((u) => (
                <button
                  key={u.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors"
                  onClick={() => handleSelect(u.id)}
                >
                  {u.profile_photo ? (
                    <img src={getImageUrl(u.profile_photo)} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-sm">{u.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      {u.username}
                      {suggestions.some(s => s.id === u.id) && (
                        <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full font-medium">Following</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{u.city || 'German Learner'} · <span className={`level-badge level-${(u.level || '').toLowerCase()}`}>{u.level}</span></p>
                  </div>
                  <MessageCircle size={16} className="text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </>
          ) : showSuggestions && filteredSuggestions.length === 0 && !q.trim() ? (
            <div className="text-center py-8">
              <MessageCircle size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">You're not following anyone yet</p>
              <p className="text-xs text-slate-400 mt-1">Follow other learners to start chatting!</p>
            </div>
          ) : q.trim() && results.length === 0 && filteredSuggestions.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">No users found</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
