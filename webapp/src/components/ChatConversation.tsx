import { useEffect, useState, useRef } from 'react'
import { listMessages, sendMessage, getImageUrl, wsUrl, listWords, markConversationRead, saveWord, listWordFolders, updateWord, type User, type Message, type WordFolder } from '../hooks/useApi'
import { ArrowLeft, Send, BookOpen, BookmarkPlus, Check, FolderPlus } from 'lucide-react'

interface ChatConversationProps {
  user: User
  conversationId: number
  otherUserId: number
  otherUsername: string
  otherProfilePhoto?: string
  otherFullName?: string
  otherIsOnline?: boolean
  otherIsPremium?: boolean
  otherPremiumStatus?: string
  onBack: () => void
}

const WORD_NEW_RE = /^\[word:(\d+)\|(.+?)\|(.+?)(?:\|(.+))?\]$/
const WORD_OLD_RE = /^\[word:(.+?)\|(.+?)(?:\|(.+))?\]$/

export function ChatConversation({ user, conversationId, otherUserId, otherUsername, otherProfilePhoto, otherFullName, otherIsOnline, otherIsPremium, otherPremiumStatus, onBack }: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [wordShareOpen, setWordShareOpen] = useState(false)
  const [myWords, setMyWords] = useState<any[]>([])
  const [userFolders, setUserFolders] = useState<WordFolder[]>([])
  const [savingWordId, setSavingWordId] = useState<number | null>(null)
  const [folderPickerWordId, setFolderPickerWordId] = useState<number | null>(null)
  const [savedWords, setSavedWords] = useState<Set<number>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listWords(user.id).then(setMyWords).catch(() => {})
    listWordFolders(user.id).then(setUserFolders).catch(() => {})
  }, [user.id])
  useEffect(() => {
    if (!wordShareOpen) return
    listWords(user.id).then(setMyWords).catch(() => {})
    listWordFolders(user.id).then(setUserFolders).catch(() => {})
  }, [wordShareOpen, user.id])

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
            )
          })
          markConversationRead(conversationId, user.id).catch(() => {})
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
      setMessages(prev => {
        const loadedIds = new Set(data.map(m => m.id))
        const extras = prev.filter(m => !loadedIds.has(m.id))
        return [...data, ...extras].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      })
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
      setMessages(prev => [...prev, msg].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ))
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

  const handleShareWord = async (w: any) => {
    setWordShareOpen(false)
    const wordMsg = `[word:${w.id}|${w.term}|${w.meaning}${w.note ? '|' + w.note : ''}]`
    try {
      const msg = await sendMessage(conversationId, user.id, wordMsg)
      setMessages(prev => [...prev, msg].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ))
    } catch (err) {
      console.error('Failed to send word:', err)
    }
  }

  const handleSaveWord = async (originalWordId: number, folderId?: number | null) => {
    setSavingWordId(originalWordId)
    setFolderPickerWordId(null)
    try {
      const saved = await saveWord(originalWordId, user.id)
      if (folderId) {
        await updateWord(saved.id, user.id, { folder_id: folderId })
      }
      setSavedWords(prev => new Set(prev).add(originalWordId))
    } catch (err) {
      console.error('Failed to save word:', err)
    } finally {
      setSavingWordId(null)
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
            {otherIsPremium && otherPremiumStatus && (
              <span className="text-sm ml-0.5">{otherPremiumStatus}</span>
            )}
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
                  <WordMessageContent
                    text={msg.text}
                    isMine={isMine}
                    userId={user.id}
                    savingWordId={savingWordId}
                    folderPickerWordId={folderPickerWordId}
                    savedWords={savedWords}
                    userFolders={userFolders}
                    onToggleSave={(id) => setFolderPickerWordId(folderPickerWordId === id ? null : id)}
                    onSaveTo={(origId, folderId) => handleSaveWord(origId, folderId)}
                    onCloseFolderPicker={() => setFolderPickerWordId(null)}
                  />
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

      {wordShareOpen && (
        <div className="border-t border-slate-100 px-3 py-2 sm:px-4 sm:py-3 max-h-40 overflow-y-auto">
          {myWords.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Share a word</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                {myWords.map((w: any) => (
                  <button
                    key={w.id}
                    className="flex-shrink-0 text-left px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 transition-colors border border-indigo-100 min-h-[44px]"
                    onClick={() => handleShareWord(w)}
                  >
                    <p className="font-semibold text-slate-900 text-sm">{w.term}</p>
                    <p className="text-xs text-slate-500">{w.meaning}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Share a word</p>
              <p className="text-sm text-slate-500">You haven't added any words yet. Add words to your list to share them in chat!</p>
            </div>
          )}
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

function WordMessageContent({
  text, isMine, userId, savingWordId, folderPickerWordId, savedWords, userFolders, onToggleSave, onSaveTo, onCloseFolderPicker
}: {
  text: string
  isMine: boolean
  userId: number
  savingWordId: number | null
  folderPickerWordId: number | null
  savedWords: Set<number>
  userFolders: WordFolder[]
  onToggleSave: (originalWordId: number) => void
  onSaveTo: (originalWordId: number, folderId?: number | null) => void
  onCloseFolderPicker: () => void
}) {
  const newMatch = text.match(WORD_NEW_RE)
  const oldMatch = !newMatch ? text.match(WORD_OLD_RE) : null
  const match = newMatch || oldMatch

  if (!match) return <p>{text}</p>

  if (newMatch) {
    const wordId = parseInt(newMatch[1], 10)
    const term = newMatch[2]
    const meaning = newMatch[3]
    const note = newMatch[4]
    const isSaved = savedWords.has(wordId)
    const isLoading = savingWordId === wordId
    const showPicker = folderPickerWordId === wordId
    const canSave = !isMine

    return (
      <div className={`relative rounded-xl p-3 text-left ${isMine ? 'bg-indigo-500' : 'bg-indigo-50'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isMine ? 'text-indigo-200' : 'text-indigo-400'}`}>
              Shared word
            </p>
            <p className={`font-bold text-base ${isMine ? 'text-white' : 'text-slate-900'}`}>
              {term}
            </p>
            <p className={`text-sm mt-0.5 ${isMine ? 'text-indigo-100' : 'text-indigo-700'}`}>
              {meaning}
            </p>
            {note && (
              <p className={`text-xs mt-1 ${isMine ? 'text-indigo-200' : 'text-slate-500'}`}>
                {note}
              </p>
            )}
          </div>
          {canSave && !isSaved && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => onToggleSave(wordId)}
                className={`p-1.5 rounded-lg transition-colors ${isMine ? 'hover:bg-indigo-400 text-indigo-200' : 'hover:bg-indigo-100 text-indigo-400'}`}
                title="Save to my words"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-qaw-spin" />
                ) : showPicker ? (
                  <Check size={16} />
                ) : (
                  <BookmarkPlus size={16} />
                )}
              </button>
              {showPicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={onCloseFolderPicker} />
                  <div className={`absolute right-0 top-full mt-1 z-20 min-w-[160px] bg-white rounded-xl shadow-xl border border-slate-200 py-1 ${isMine ? 'right-0' : 'left-0'}`}>
                    <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Save to folder</p>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      onClick={() => onSaveTo(wordId, null)}
                    >
                      <FolderPlus size={14} className="text-slate-400" />
                      Uncategorized
                    </button>
                    {userFolders.map(f => (
                      <button
                        key={f.id}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        onClick={() => onSaveTo(wordId, f.id)}
                      >
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: f.color || '#6366f1' }} />
                        {f.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {canSave && isSaved && (
            <div className={`flex items-center gap-1 text-xs font-semibold flex-shrink-0 mt-0.5 ${isMine ? 'text-indigo-200' : 'text-indigo-500'}`}>
              <Check size={14} />
              Saved
            </div>
          )}
        </div>
      </div>
    )
  }

  if (oldMatch) {
    const term = oldMatch[1]
    const meaning = oldMatch[2]
    const note = oldMatch[3]
    return (
      <div className={`rounded-xl p-3 text-left ${isMine ? 'bg-indigo-500' : 'bg-indigo-50'}`}>
        <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isMine ? 'text-indigo-200' : 'text-indigo-400'}`}>
          Shared word
        </p>
        <p className={`font-bold text-base ${isMine ? 'text-white' : 'text-slate-900'}`}>
          {term}
        </p>
        <p className={`text-sm mt-0.5 ${isMine ? 'text-indigo-100' : 'text-indigo-700'}`}>
          {meaning}
        </p>
        {note && (
          <p className={`text-xs mt-1 ${isMine ? 'text-indigo-200' : 'text-slate-500'}`}>
            {note}
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
