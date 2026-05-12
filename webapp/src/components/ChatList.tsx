import { useEffect, useState } from 'react'
import { listConversations, listFollowing, createConversation, acceptChatRequest, deleteConversation, getImageUrl, wsUrl, type Conversation, type User } from '../hooks/useApi'
import { MessageCircle, ChevronRight, Plus, Check, X } from 'lucide-react'

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

    const ws = new WebSocket(`${wsUrl}/api/v1/ws/chat/${user.id}`)
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'new_message') {
          loadConversations()
        }
      } catch {}
    }
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping')
    }, 30000)

    return () => { if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close(); clearInterval(ping) }
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

  const handleAcceptRequest = async (convId: number) => {
    try {
      await acceptChatRequest(convId, user.id)
      loadConversations()
    } catch (err) {
      console.error('Failed to accept request:', err)
    }
  }

  const handleDeclineRequest = async (convId: number) => {
    try {
      await deleteConversation(convId, user.id)
      loadConversations()
    } catch (err) {
      console.error('Failed to decline request:', err)
    }
  }

  const pendingConversations = conversations.filter(c => c.is_pending)
  const acceptedConversations = conversations.filter(c => !c.is_pending)
  const conversationUserIds = new Set(acceptedConversations.map(c => c.other_user.id))
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
    <div className="card px-3 py-3 sm:p-4 space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageCircle size={20} className="text-indigo-500 sm:hidden" />
          <MessageCircle size={22} className="text-indigo-500 hidden sm:block" />
          Messages
        </h2>
        {acceptedConversations.some(c => c.unread_count > 0) ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Unread</span>
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {acceptedConversations.reduce((sum, c) => sum + c.unread_count, 0)}
            </span>
          </div>
        ) : (
          <button
            className="px-4 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors min-h-[36px]"
            onClick={onStartNewChat}
          >
            New Message
          </button>
        )}
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
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 active:bg-indigo-100 transition-colors text-left min-h-[60px]"
                onClick={() => handleStartChat(u.id)}
              >
                {u.profile_photo ? (
                  <img src={getImageUrl(u.profile_photo)} alt={u.username} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-sm sm:text-base">{u.username.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                    {u.username}
                    {u.full_name && <span className="text-xs text-slate-400 font-normal ml-1.5 hidden sm:inline">({u.full_name})</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{u.city || 'German Learner'} · <span className={`level-badge level-${(u.level || '').toLowerCase()}`}>{u.level}</span></p>
                </div>
                <Plus size={20} className="text-indigo-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-8">
            <MessageCircle size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm">No conversations yet</p>
            <p className="text-slate-400 text-xs mt-1">Follow other learners to start chatting!</p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Pending Requests */}
          {pendingConversations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide px-1 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Requests ({pendingConversations.length})
              </p>
              <div className="space-y-2">
                {pendingConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100"
                  >
                    {conv.other_user.profile_photo ? (
                      <img src={getImageUrl(conv.other_user.profile_photo)} alt={conv.other_user.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold">{conv.other_user.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{conv.other_user.username}</p>
                      {conv.last_message && (
                        <p className="text-xs text-slate-500 truncate">{conv.last_message.text}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        className="p-2.5 bg-white text-green-600 rounded-xl hover:bg-green-50 active:bg-green-100 transition-colors border border-green-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
                        onClick={() => handleAcceptRequest(conv.id)}
                        title="Accept"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        className="p-2.5 bg-white text-red-500 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors border border-red-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
                        onClick={() => handleDeclineRequest(conv.id)}
                        title="Decline"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Conversations */}
          {acceptedConversations.length > 0 && (
            <div className="space-y-0.5">
              {pendingConversations.length > 0 && (
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-1.5 mt-3">Messages</p>
              )}
              {acceptedConversations.map((conv) => (
                <button
                  key={conv.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left min-h-[64px]"
                  onClick={() => onSelectConversation(conv.id, conv.other_user.id, conv.other_user.username, conv.other_user.profile_photo, conv.other_user.full_name, conv.other_user.is_online)}
                >
                  {conv.other_user.profile_photo ? (
                    <img
                      src={getImageUrl(conv.other_user.profile_photo)}
                      alt={conv.other_user.username}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-bold text-sm sm:text-base">{conv.other_user.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                        {conv.other_user.username}
                        {conv.other_user.full_name && (
                          <span className="text-xs text-slate-400 font-normal ml-1.5 hidden sm:inline">({conv.other_user.full_name})</span>
                        )}
                      </p>
                      {conv.last_message && (
                        <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                          {formatTimeAgo(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
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
                  <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {acceptedConversations.length > 0 && availableSuggestions.length > 0 && (
        <div className="pt-3 sm:pt-4 border-t border-slate-100 mt-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">People you follow</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {availableSuggestions.slice(0, 8).map((u) => (
              <button
                key={u.id}
                className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-indigo-50 active:bg-indigo-100 transition-colors min-w-[72px]"
                onClick={() => handleStartChat(u.id)}
              >
                {u.profile_photo ? (
                  <img src={getImageUrl(u.profile_photo)} alt={u.username} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-sm">{u.username.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <p className="font-semibold text-slate-900 text-[11px] truncate w-full text-center leading-tight">{u.username}</p>
              </button>
            ))}
            <button
              className="flex-shrink-0 flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-indigo-50 active:bg-indigo-100 transition-colors min-w-[72px]"
              onClick={onStartNewChat}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Plus size={20} className="text-indigo-500" />
              </div>
              <p className="text-[11px] text-indigo-500 font-semibold text-center leading-tight">All</p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
