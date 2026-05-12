import { useEffect, useState, useRef } from 'react'
import { listMessages, sendMessage, getImageUrl, wsUrl, listWords, markConversationRead, type User, type Message } from '../hooks/useApi'
import { ArrowLeft, Send, BookOpen } from 'lucide-react'

interface ChatConversationProps {
  user: User
  conversationId: number
  otherUserId: number
  otherUsername: string
  otherProfilePhoto?: string
  otherFullName?: string
  otherIsOnline?: boolean
  onBack: () => void
}

export function ChatConversation({ user, conversationId, otherUserId, otherUsername, otherProfilePhoto, otherFullName, otherIsOnline, onBack }: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [wordShareOpen, setWordShareOpen] = useState(false)
  const [myWords, setMyWords] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { listWords(user.id).then(setMyWords).catch(() => {}) }, [user.id])

  useEffect(() => {
    loadMessages()
    inputRef.current?.focus()

    const ws = new WebSocket(`${wsUrl}/api/v1/ws/chat/${user.id}`)
    let fallbackInterval: ReturnType<typeof setInterval> | null = null

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'new_message' && data.conversation_id === conversationId) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev
            return [...prev, data.message].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ).map(m => m.id === data.message.id ? { ...m, ...data.message } : m)
          })
          // Update read receipt on backend so unread count reflects current view
          listMessages(conversationId, user.id, 1)
        }
      } catch {}
    }

    ws.onerror = () => {
      fallbackInterval = setInterval(loadMessages, 5000)
    }

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping')
    }, 30000)

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close()
      clearInterval(ping)
      if (fallbackInterval) clearInterval(fallbackInterval)
    }
  }, [conversationId, user.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    try {
      const data = await listMessages(conversationId, user.id)
      setMessages(data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
      markConversationRead(conversationId, user.id).catch(() => {})
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(conversationId, user.id, text.trim())
      setMessages(prev => [...prev, msg])
      setText('')
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="card p-0 flex flex-col h-[70dvh] sm:h-[600px] min-h-[400px]">
      <div className="flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 border-b border-slate-200">
        <button className="p-2 -ml-1 rounded-xl hover:bg-slate-100 transition-colors active:bg-slate-200 tap-highlight-transparent" onClick={onBack}>
          <ArrowLeft size={22} className="text-slate-600" />
        </button>
        {otherProfilePhoto ? (
          <img src={getImageUrl(otherProfilePhoto)} alt={otherUsername} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-600 font-bold text-sm sm:text-base">{otherUsername.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
            {otherUsername}
            {otherFullName && <span className="text-xs text-slate-400 font-normal ml-1.5 hidden sm:inline">({otherFullName})</span>}
          </p>
          <p className="text-xs flex items-center gap-1 mt-0.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${otherIsOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className={otherIsOnline ? 'text-green-600' : 'text-slate-400'}>
              {otherIsOnline ? 'Active today' : 'Offline'}
            </span>
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 space-y-3 scroll-soft">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-qaw-spin mx-auto" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user.id
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-900 rounded-bl-md'
                  }`}
                >
                  {renderMessageContent(msg.text, isMine)}
                  <p className={`text-xs mt-1 ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {wordShareOpen && myWords.length > 0 && (
        <div className="border-t border-slate-100 px-3 py-2 sm:px-4 sm:py-3 max-h-40 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Share a word</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {myWords.map((w: any) => (
              <button
                key={w.id}
                className="flex-shrink-0 text-left px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 transition-colors border border-indigo-100 min-h-[44px]"
                onClick={() => {
                  const wordMsg = `[word:${w.term}|${w.meaning}${w.note ? '|' + w.note : ''}]`
                  setText(wordMsg)
                  setWordShareOpen(false)
                  inputRef.current?.focus()
                }}
              >
                <p className="font-semibold text-slate-900 text-sm">{w.term}</p>
                <p className="text-xs text-slate-500">{w.meaning}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="border-t border-slate-200 px-3 py-3 sm:px-4 sm:py-4 safe-area-inset-bottom">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[44px]"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button
            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors active:bg-indigo-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setWordShareOpen(!wordShareOpen)}
            title="Share a word"
          >
            <BookOpen size={20} />
          </button>
          <button
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors active:bg-indigo-800 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={handleSend}
            disabled={!text.trim() || sending}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

function renderMessageContent(text: string, isMine: boolean) {
  const wordMatch = text.match(/^\[word:(.+?)\|(.+?)(?:\|(.+))?\]$/)
  if (wordMatch) {
    return (
      <div className={`rounded-xl p-3 text-left ${isMine ? 'bg-indigo-500' : 'bg-indigo-50'}`}>
        <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isMine ? 'text-indigo-200' : 'text-indigo-400'}`}>
          Shared word
        </p>
        <p className={`font-bold text-base ${isMine ? 'text-white' : 'text-slate-900'}`}>
          {wordMatch[1]}
        </p>
        <p className={`text-sm mt-0.5 ${isMine ? 'text-indigo-100' : 'text-indigo-700'}`}>
          {wordMatch[2]}
        </p>
        {wordMatch[3] && (
          <p className={`text-xs mt-1 ${isMine ? 'text-indigo-200' : 'text-slate-500'}`}>
            {wordMatch[3]}
          </p>
        )}
      </div>
    )
  }
  return <p>{text}</p>
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
