import { useEffect, useMemo, useState } from 'react'
import { Landing } from './screens/Landing'
import { Profile } from './screens/Profile'
import { Feed } from './screens/Feed'
import { Search } from './screens/Search'
import { Words } from './screens/Words'
import { Onboarding } from './screens/Onboarding'
import { Notifications } from './components/Notifications'
import GrammarCurriculum from './screens/GrammarCurriculum'

import { useSession } from './hooks/useSession'
import { Header } from './components/Header'
import { WolfLogo } from './components/WolfIllustrations'

import type { User } from './hooks/useApi'
import { fetchNotifications, followUser, fetchUnreadChatCount, createConversation, getUser, wsUrl } from './hooks/useApi'
import { Home, User as UserIcon, BookOpen, PenTool, MessageCircle } from 'lucide-react'
import ChatScreen from './screens/ChatScreen'
import TranslateScreen from './screens/TranslateScreen'
import NotesScreen from './screens/NotesScreen'

export type Screen = 'feed' | 'profile' | 'search' | 'words' | 'notifications' | 'user-profile' | 'grammar' | 'chat' | 'translate' | 'notes'

function App() {
  const { user, loading, signIn, signInWithPassword, signOut, refresh, setUser } = useSession()
  const [screen, setScreen] = useState<Screen>('feed')
  const [viewedUserId, setViewedUserId] = useState<number | null>(null)
  const [onboarded, setOnboarded] = useState(() => {
    return localStorage.getItem('deutschly:onboarded') === 'true'
  })
  const [unreadCount, setUnreadCount] = useState(0)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const [followVersion, setFollowVersion] = useState(0)
  const [chatTargetConvId, setChatTargetConvId] = useState<number | null>(null)
  const [chatTargetUserId, setChatTargetUserId] = useState<number | null>(null)
  const [chatTargetUsername, setChatTargetUsername] = useState<string>('')
  const [chatTargetPhoto, setChatTargetPhoto] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!user) return
    fetchNotifications(user.id, 1, 0).then((d) => setUnreadCount(d.unread_count || 0)).catch(() => {})
  }, [user, screen])

  useEffect(() => {
    if (!user) return
    const fetchCount = () => fetchUnreadChatCount(user.id).then((d) => setChatUnreadCount(d.unread_count || 0)).catch(() => {})
    fetchCount()
    const interval = setInterval(fetchCount, 15000)
    return () => clearInterval(interval)
  }, [user, screen])

  // App-level WebSocket for real-time chat unread badge updates
  useEffect(() => {
    if (!user) return
    const ws = new WebSocket(`${wsUrl}/api/v1/ws/chat/${user.id}`)
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'new_message') {
          setChatUnreadCount(prev => prev + 1)
        }
      } catch {}
    }
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping')
    }, 30000)
    return () => { if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close(); clearInterval(ping) }
  }, [user?.id])

  const handleOpenChat = async (targetUserId: number) => {
    try {
      const conv = await createConversation(user.id, targetUserId)
      const targetUser = await getUser(targetUserId)
      setChatTargetConvId(conv.id)
      setChatTargetUserId(targetUserId)
      setChatTargetUsername(targetUser?.username || 'User')
      setChatTargetPhoto(targetUser?.profile_photo)
      setScreen('chat')
    } catch (err) {
      console.error('Failed to open chat:', err)
      setScreen('chat')
    }
  }

  const nav = useMemo(
    () => [
      { key: 'feed' as Screen, label: 'Feed' },
      { key: 'search' as Screen, label: 'Discover' },
      { key: 'words' as Screen, label: 'Words' },
      { key: 'grammar' as Screen, label: 'Grammar' },
      { key: 'translate' as Screen, label: 'Translate' },
      { key: 'notes' as Screen, label: 'Notes' },
      { key: 'profile' as Screen, label: 'Profile' },
      { key: 'chat' as Screen, label: 'Chat' },
      { key: 'notifications' as Screen, label: 'Alerts' },
    ],
    []
  )

  if (loading) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <div className="loading-spinner" />
          <span>Loading your Deutschly space...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Landing onJoin={signIn} onLogin={signInWithPassword} />
  }

  if (!onboarded) {
    return (
      <Onboarding
        user={user}
        onDone={(updatedUser) => {
          setUser(updatedUser)
          localStorage.setItem('deutschly:onboarded', 'true')
          setOnboarded(true)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen hero-bg pb-20 md:pb-0" style={{ overflow: 'visible' }}>
      {/* ============================================
          Background Decorative Elements - QA Wolf Style
      ============================================ */}
      
      {/* Floating orbs - QA Wolf uses these for visual interest */}
      <div className="fixed top-40 right-1/4 w-40 h-40 qaw-orb qaw-orb-indigo opacity-20 animate-qaw-float will-change-transform" style={{ animationDelay: '0.5s' }} />
      <div className="fixed bottom-20 left-1/4 w-32 h-32 qaw-orb qaw-orb-sky opacity-15 animate-qaw-float will-change-transform" style={{ animationDelay: '1.5s' }} />
      <div className="fixed top-1/3 left-10 w-24 h-24 qaw-orb qaw-orb-purple opacity-10 animate-qaw-float will-change-transform" style={{ animationDelay: '2.5s' }} />
      
      {/* Subtle pattern overlay */}
      <div className="fixed inset-0 bg-qaw-pattern pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* ============================================
            Header - QA Wolf Style
        ============================================ */}
        <header className="relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 p-4 animate-qaw-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            {/* Logo with Wolf */}
            <WolfLogo showText />
            
            <Header 
              user={user} 
              nav={nav} 
              active={screen} 
              onNav={(s) => {
                setScreen(s)
                if (s === 'notifications') setUnreadCount(0)
                if (s !== 'chat') { setChatTargetConvId(null); setChatTargetUserId(null) }
              }} 
              onLogout={signOut}
              unreadCount={unreadCount}
              chatUnreadCount={chatUnreadCount}
            />
          </div>
        </header>

        {/* ============================================
            Main Content Grid - Responsive Layout
        ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr,1fr] lg:grid-cols-[2fr,1fr] gap-6">
          
          {/* Main Content Area - Full width on mobile, 3/4 on tablet, 2/3 on desktop */}
          <div className="space-y-6 w-full">
            <div className="card animate-qaw-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {screen === 'feed' && <Feed key={followVersion} user={user} onDiscover={() => setScreen('search')} onUserUpdated={refresh} onViewUser={(uid) => { setViewedUserId(uid); setScreen('user-profile'); }} onNotifications={() => { setScreen('notifications'); setUnreadCount(0) }} unreadNotifCount={unreadCount} />}
              {screen === 'search' && <Search user={user} onViewUser={(userId) => { setViewedUserId(userId); setScreen('user-profile'); }} onFollow={async (targetId) => { await followUser(targetId, user.id); setFollowVersion(v => v + 1) }} onOpenChat={handleOpenChat} />}
              {screen === 'words' && <Words user={user} onUserUpdated={refresh} />}
              {screen === 'grammar' && <GrammarCurriculum user={user} onUserUpdated={refresh} />}
              {screen === 'profile' && <Profile user={user} currentUser={user} onUpdated={setUser} onNavigate={(s) => setScreen(s as Screen)} onViewUser={(uid) => { setViewedUserId(uid); setScreen('user-profile'); }} onOpenChat={handleOpenChat} />}
              {screen === 'user-profile' && viewedUserId && <Profile userId={viewedUserId} currentUser={user} onUpdated={setUser} onBack={() => setScreen('search')} onViewUser={(userId) => { setViewedUserId(userId); setScreen('user-profile'); }} onNavigate={(s) => setScreen(s as Screen)} onOpenChat={handleOpenChat} />}
              {screen === 'chat' && (
                <ChatScreen
                  key={chatTargetConvId ?? 'list'}
                  user={user}
                  initialConvId={chatTargetConvId || undefined}
                  initialOtherUserId={chatTargetUserId || undefined}
                  initialOtherUsername={chatTargetUsername || undefined}
                  initialOtherPhoto={chatTargetPhoto}
                />
              )}
              {screen === 'notifications' && <Notifications user={user} />}
              {screen === 'translate' && <TranslateScreen user={user} onUserUpdated={refresh} />}
              {screen === 'notes' && <NotesScreen user={user} />}
            </div>
          </div>

          {/* ============================================
              Sidebar - QA Wolf Style Cards
              Hidden on mobile, visible on tablet+ (md:)
          ============================================ */}
          <div className="space-y-4 hidden md:block">
            
            {/* Quick Stats */}
            <div className="card animate-qaw-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3 L15 9 L21 12 L15 15 L12 21 L9 15 L3 12 L9 9 L12 3" />
                </svg>
                Learning Stats
              </h3>
              <div className="space-y-3">
               {[
                    { label: 'Words', value: user.words_count || 0 },
                     { label: 'Posts', value: user.posts_count || 0 },
                     { label: 'Followers', value: user.followers_count || 0 },
                     { label: 'Following', value: user.following_count || 0 },
                     { label: 'Streak 🔥', value: user.streak || 0 },
                 ].map((stat, i) => (
                  <div 
                    key={stat.label} 
                    className="flex justify-between items-center p-2 bg-slate-50 rounded-xl opacity-0 animate-qaw-fade-in-up stagger-1"
                    style={{ animationDelay: `${0.7 + i * 0.1}s` }}
                  >
                    <span className="text-slate-600">{stat.label}</span>
                    <span className="font-bold text-indigo-700">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Highlight Card */}
            <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-0 animate-qaw-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 22 L20 20 L22 22 L20 24 L18 22" />
                    <path d="M15 22 L17 20" />
                    <path d="M5 18 L7 16 L9 18 L11 16 L13 18" />
                    <path d="M5 18 Q3 16 5 14" />
                    <circle cx="7" cy="17" r="0.5" fill="currentColor" />
                    <circle cx="11" cy="17" r="0.5" fill="currentColor" />
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900">Connect & Share</h4>
                <p className="text-sm text-slate-600">
                  Join a community of German learners. Share your journey, learn together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Only on small screens */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 md:hidden z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-1.5">
            {[
              { key: 'feed' as Screen, icon: Home, label: 'Feed' },
              { key: 'words' as Screen, icon: BookOpen, label: 'Words' },
              { key: 'grammar' as Screen, icon: PenTool, label: 'Grammar' },
              { key: 'chat' as Screen, icon: MessageCircle, label: 'Chat' },
              { key: 'profile' as Screen, icon: UserIcon, label: 'Profile' },
            ].map((item) => {
            const Icon = item.icon
            const isActive = screen === item.key
            return (
              <button
                key={item.key}
                onClick={() => { setScreen(item.key); if (item.key === 'notifications') setUnreadCount(0); if (item.key !== 'chat') { setChatTargetConvId(null); setChatTargetUserId(null) } }}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="relative">
                  <Icon size={20} />
                  {item.key === 'chat' && chatUnreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default App
