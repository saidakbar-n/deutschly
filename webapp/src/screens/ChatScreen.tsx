import { useState, useEffect } from 'react'
import { ChatList } from '../components/ChatList'
import { ChatConversation } from '../components/ChatConversation'
import { NewChatModal } from '../components/NewChatModal'
import type { User } from '../hooks/useApi'

interface ChatScreenProps {
  user: User
  initialConvId?: number
  initialOtherUserId?: number
  initialOtherUsername?: string
  initialOtherPhoto?: string
}

type View = 'list' | 'conversation'

export default function ChatScreen({ user, initialConvId, initialOtherUserId, initialOtherUsername, initialOtherPhoto }: ChatScreenProps) {
  const [view, setView] = useState<View>('list')
  const [activeConvId, setActiveConvId] = useState<number | null>(null)
  const [activeOtherUserId, setActiveOtherUserId] = useState<number | null>(null)
  const [activeOtherUsername, setActiveOtherUsername] = useState('')
  const [activeOtherPhoto, setActiveOtherPhoto] = useState<string | undefined>(undefined)
  const [activeOtherFullName, setActiveOtherFullName] = useState<string | undefined>(undefined)
  const [activeOtherIsOnline, setActiveOtherIsOnline] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)

  useEffect(() => {
    if (initialConvId && initialOtherUserId) {
      setActiveConvId(initialConvId)
      setActiveOtherUserId(initialOtherUserId)
      setActiveOtherUsername(initialOtherUsername || 'User')
      setActiveOtherPhoto(initialOtherPhoto)
      setView('conversation')
    }
  }, [initialConvId, initialOtherUserId])

  const handleSelectConversation = (convId: number, otherUserId: number, otherUsername: string, otherProfilePhoto?: string, otherFullName?: string, otherIsOnline?: boolean) => {
    setActiveConvId(convId)
    setActiveOtherUserId(otherUserId)
    setActiveOtherUsername(otherUsername)
    setActiveOtherPhoto(otherProfilePhoto)
    setActiveOtherFullName(otherFullName)
    setActiveOtherIsOnline(otherIsOnline || false)
    setView('conversation')
  }

  const handleConversationCreated = (convId: number, otherUserId: number) => {
    setNewChatOpen(false)
    setActiveConvId(convId)
    setActiveOtherUserId(otherUserId)
    setView('conversation')
  }

  if (view === 'conversation' && activeConvId && activeOtherUserId) {
    return (
      <div className="animate-qaw-fade-in-up">
        <ChatConversation
          user={user}
          conversationId={activeConvId}
          otherUserId={activeOtherUserId}
          otherUsername={activeOtherUsername || 'User'}
          otherProfilePhoto={activeOtherPhoto}
          otherFullName={activeOtherFullName}
          otherIsOnline={activeOtherIsOnline}
          onBack={() => {
            setView('list')
            setActiveConvId(null)
            setActiveOtherUserId(null)
            setActiveOtherFullName(undefined)
            setActiveOtherIsOnline(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="animate-qaw-fade-in-up">
      <ChatList
        user={user}
        onSelectConversation={handleSelectConversation}
        onStartNewChat={() => setNewChatOpen(true)}
      />
      <NewChatModal
        user={user}
        isOpen={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  )
}
