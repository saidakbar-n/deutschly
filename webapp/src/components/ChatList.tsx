import { useEffect, useState } from 'react'
import { listConversations, listFollowing, createConversation, getImageUrl, type Conversation, type User } from '../hooks/useApi'
import { MessageCircle, ChevronRight, Plus } from 'lucide-react'

interface ChatListProps {
  user: User
  onSelectConversation: (conversationId: number, otherUserId: number, otherUsername: string, otherProfilePhoto?: string, otherFullName?: string, otherIsOnline?: boolean) => void
  onStartNewChat: () => void
}

export function ChatList({ user, onSelectConversation, onStartNewChat }: ChatListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  useEffect(() => {
    loadConversations()
    loadSuggestions()
  }, [user.id])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const data = await listConversations(user.id)
      setConversations(data)
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSuggestions = async () => {
    setSuggestionsLoading(true)
    try {
      const data = await listFollowing(user.id)
      const following = (data.following || []).filter((u: User) => u.id !== user.id)
      setSuggestions(following)
    } catch (err) {
      console.error('Failed to load suggestions:', err)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const handleStartChat = async (otherUserId: number) => {
    try {
      const conv = await createConversation(user.id, otherUserId)
      const other = suggestions.find(u => u.id === otherUserId)
      onSelectConversation(conv.id, otherUserId, other?.username || 'User', other?.profile_photo, other?.full_name, other?.is_online)
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  const conversationUserIds = new Set(conversations.map(c => c.other_user.id))
  const availableSuggestions = suggestions.filter(u => !conversationUserIds.has(u.id))

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-qaw-spin mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Loading conversations...</p>
      </div>
    )
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageCircle size={22} className="text-indigo-500" />
          Messages
        </h2>
        <button
          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          onClick={onStartNewChat}
        >
          New Message
        </button>
      </div>

      {conversations.length === 0 ? (
        suggestionsLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-qaw-spin mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Finding people to chat with...</p>
          </div>
        ) : availableSuggestions.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">Start a conversation</p>
            {availableSuggestions.map((u) => (
              <button
                key={u.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors text-left"
                onClick={() => handleStartChat(u.id)}
              >
                {u.profile_photo ? (
                  <img src={getImageUrl(u.profile_photo)} alt={u.username} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold">{u.username.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {u.username}
                    {u.full_name && <span className="text-xs text-slate-400 font-normal ml-1.5">({u.full_name})</span>}
                  </p>
                  <p className="text-xs text-slate-500">{u.city || 'German Learner'} · <span className={`level-badge level-${(u.level || '').toLowerCase()}`}>{u.level}</span></p>
                </div>
                <Plus size={18} className="text-indigo-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm">No conversations yet</p>
            <p className="text-slate-400 text-xs mt-1">Follow other learners to start chatting!</p>
          </div>
        )
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
              onClick={() => onSelectConversation(conv.id, conv.other_user.id, conv.other_user.username, conv.other_user.profile_photo, conv.other_user.full_name, conv.other_user.is_online)}
            >
              {conv.other_user.profile_photo ? (
                <img
                  src={getImageUrl(conv.other_user.profile_photo)}
                  alt={conv.other_user.username}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold">{conv.other_user.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 truncate">
                    {conv.other_user.username}
                    {conv.other_user.full_name && (
                      <span className="text-xs text-slate-400 font-normal ml-1.5">({conv.other_user.full_name})</span>
                    )}
                  </p>
                  {conv.last_message && (
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                      {formatTimeAgo(conv.last_message.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 truncate flex-1">
                    {conv.last_message ? (
                      <>
                        {conv.last_message.sender_id === user.id && <span className="text-slate-400">You: </span>}
                        {conv.last_message.text}
                      </>
                    ) : (
                      <span className="italic text-slate-400">Start a conversation</span>
                    )}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
      {conversations.length > 0 && availableSuggestions.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">People you follow</p>
          {availableSuggestions.slice(0, 5).map((u) => (
            <button
              key={u.id}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors text-left"
              onClick={() => handleStartChat(u.id)}
            >
              {u.profile_photo ? (
                <img src={getImageUrl(u.profile_photo)} alt={u.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold">{u.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">
                  {u.username}
                  {u.full_name && <span className="text-xs text-slate-400 font-normal ml-1.5">({u.full_name})</span>}
                </p>
              </div>
              <Plus size={16} className="text-indigo-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString()
}
