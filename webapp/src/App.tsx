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
import { Home, User as UserIcon, BookOpen, PenTool, MessageCircle, TreePine, Compass, Bell, Languages, StickyNote, Sparkles, PanelRight } from 'lucide-react'
import ChatScreen from './screens/ChatScreen'
import TranslateScreen from './screens/TranslateScreen'
import NotesScreen from './screens/NotesScreen'
import ProgressScreen from './screens/ProgressScreen'
import { LevelUpProvider } from './contexts/LevelUpContext'
import LevelUpPopup from './components/LevelUpPopup'

export type Screen = 'feed' | 'profile' | 'search' | 'words' | 'notifications' | 'user-profile' | 'grammar' | 'chat' | 'translate' | 'notes' | 'progress'

const BOTTOM_NAV_ITEMS = [
  { key: 'feed' as Screen, icon: Home, label: 'Feed' },
  { key: 'search' as Screen, icon: Compass, label: 'Discover' },
  { key: 'words' as Screen, icon: BookOpen, label: 'Words' },
  { key: 'grammar' as Screen, icon: PenTool, label: 'Grammar' },
  { key: 'translate' as Screen, icon: Languages, label: 'Translate' },
  { key: 'notes' as Screen, icon: StickyNote, label: 'Notes' },
  { key: 'progress' as Screen, icon: TreePine, label: 'Progress' },
  { key: 'chat' as Screen, icon: MessageCircle, label: 'Chat' },
  { key: 'notifications' as Screen, icon: Bell, label: 'Alerts' },
  { key: 'profile' as Screen, icon: UserIcon, label: 'Profile' },
]

const SIDEBAR_STATS = [
  { label: 'Words', icon: '📝' },
  { label: 'Posts', icon: '📫' },
  { label: 'Followers', icon: '👥' },
  { label: 'Following', icon: '👤' },
  { label: 'Streak', icon: '🔥' },
]

function SidebarStats({ user }: { user: User }) {
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Learning Stats
        </h3>
        <div className="space-y-1.5">
         {SIDEBAR_STATS.map((stat) => {
           const value = stat.label === 'Words' ? user.words_count
             : stat.label === 'Posts' ? user.posts_count
             : stat.label === 'Followers' ? user.followers_count
             : stat.label === 'Following' ? user.following_count
             : user.streak
           return (
            <div key={stat.label} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-600 text-xs flex items-center gap-1.5">
                <span>{stat.icon}</span>
                {stat.label}
              </span>
              <span className="font-bold text-indigo-700 text-xs">{value || 0}</span>
            </div>
           )
         })}
        </div>
      </div>

      <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-0 p-5">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto">
            <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 22 L20 20 L22 22 L20 24 L18 22" />
              <path d="M15 22 L17 20" />
              <path d="M5 18 L7 16 L9 18 L11 16 L13 18" />
              <path d="M5 18 Q3 16 5 14" />
              <circle cx="7" cy="17" r="0.5" fill="currentColor" />
              <circle cx="11" cy="17" r="0.5" fill="currentColor" />
            </svg>
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Connect & Share</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Join a community of German learners. Share your journey, learn together.
          </p>
        </div>
      </div>
    </div>
  )
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const ws = new WebSocket(`${wsUrl}/api/v1/ws/chat/${user.id}`)
    ws.onmessage = (e) => {
      if (cancelled) return
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'new_message') {
          setChatUnreadCount(prev => prev + 1)
        }
      } catch {}
    }
    ws.onerror = () => {}
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping')
    }, 30000)
    return () => { cancelled = true; clearInterval(ping); ws.close() }
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

  const handleNav = (s: Screen) => {
    setScreen(s)
    if (s === 'notifications') setUnreadCount(0)
    if (s !== 'chat') { setChatTargetConvId(null); setChatTargetUserId(null) }
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

  const renderScreen = () => {
    switch (screen) {
      case 'feed':
        return <Feed key={followVersion} user={user} onDiscover={() => setScreen('search')} onUserUpdated={refresh} onViewUser={(uid) => { setViewedUserId(uid); setScreen('user-profile'); }} onNotifications={() => { setScreen('notifications'); setUnreadCount(0) }} unreadNotifCount={unreadCount} />
      case 'search':
        return <Search user={user} onViewUser={(userId) => { setViewedUserId(userId); setScreen('user-profile'); }} onFollow={async (targetId) => { await followUser(targetId, user.id); setFollowVersion(v => v + 1) }} onOpenChat={handleOpenChat} />
      case 'words':
        return <Words user={user} onUserUpdated={refresh} />
      case 'grammar':
        return <GrammarCurriculum user={user} onUserUpdated={refresh} />
      case 'profile':
        return <Profile user={user} currentUser={user} onUpdated={setUser} onNavigate={(s) => setScreen(s as Screen)} onViewUser={(uid) => { setViewedUserId(uid); setScreen('user-profile'); }} onOpenChat={handleOpenChat} />
      case 'user-profile':
        return viewedUserId ? <Profile userId={viewedUserId} currentUser={user} onUpdated={setUser} onBack={() => setScreen('search')} onViewUser={(userId) => { setViewedUserId(userId); setScreen('user-profile'); }} onNavigate={(s) => setScreen(s as Screen)} onOpenChat={handleOpenChat} /> : null
      case 'chat':
        return (
          <ChatScreen
            key={chatTargetConvId ?? 'list'}
            user={user}
            initialConvId={chatTargetConvId || undefined}
            initialOtherUserId={chatTargetUserId || undefined}
            initialOtherUsername={chatTargetUsername || undefined}
            initialOtherPhoto={chatTargetPhoto}
          />
        )
      case 'notifications':
        return <Notifications user={user} />
      case 'translate':
        return <TranslateScreen user={user} onUserUpdated={refresh} />
      case 'notes':
        return <NotesScreen user={user} />
      case 'progress':
        return <ProgressScreen user={user} />
      default:
        return null
    }
  }

  return (
    <LevelUpProvider>
      <div className="min-h-dvh hero-bg" style={{ overflow: 'visible' }}>
        
        {/* Background decorative elements - tablet/desktop only */}
        <div className="hidden md:block fixed top-40 right-1/4 w-40 h-40 qaw-orb qaw-orb-indigo opacity-20 animate-qaw-float will-change-transform" style={{ animationDelay: '0.5s' }} />
        <div className="hidden md:block fixed bottom-20 left-1/4 w-32 h-32 qaw-orb qaw-orb-sky opacity-15 animate-qaw-float will-change-transform" style={{ animationDelay: '1.5s' }} />
        <div className="hidden xl:block fixed top-1/3 left-10 w-24 h-24 qaw-orb qaw-orb-purple opacity-10 animate-qaw-float will-change-transform" style={{ animationDelay: '2.5s' }} />
        <div className="fixed inset-0 bg-qaw-pattern pointer-events-none" />

        {/* ============================================
            Tier 2+3: Tablet & Desktop Header
            Hidden on mobile (<768px)
        ============================================ */}
        <div className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-3 md:px-4 xl:px-6 py-2.5 md:py-3 flex items-center justify-between">
            <button onClick={() => setScreen('feed')} className="hover:opacity-80 transition-opacity shrink-0">
              <WolfLogo showText />
            </button>
            <Header 
              user={user} 
              nav={nav} 
              active={screen} 
              onNav={handleNav} 
              onLogout={signOut}
              unreadCount={unreadCount}
              chatUnreadCount={chatUnreadCount}
            />
          </div>
        </div>

        {/* Mobile status bar spacer */}
        <div className="md:hidden pt-safe" />

        {/* ============================================
            Main Content — Three Tier Layout
            Mobile:  full-bleed, no sidebar
            Tablet:  sidebar toggle via button
            Desktop: persistent sidebar
        ============================================ */}
        <div className="content-container">
          <div className="flex gap-0 md:gap-4 xl:gap-6">

            {/* ============================================
                Main Content Area
            ============================================ */}
            <div className="flex-1 min-w-0">
              {/* Tier 1: Mobile - full bleed, no card wrapper */}
              <div className="md:hidden">
                {renderScreen()}
              </div>
              {/* Tier 2: Tablet - card wrapper */}
              <div className="hidden md:block xl:hidden my-3 md:my-4">
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 md:p-4 animate-qaw-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  {renderScreen()}
                </div>
              </div>
              {/* Tier 3: Desktop - card wrapper */}
              <div className="hidden xl:block my-5">
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 xl:p-5 animate-qaw-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  {renderScreen()}
                </div>
              </div>
            </div>

            {/* ============================================
                Sidebar
                Tablet: toggle button + overlay drawer
                Desktop: always visible
            ============================================ */}
            {/* Tablet sidebar toggle button */}
            <div className="hidden md:block xl:hidden shrink-0 my-3 md:my-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-slate-400 hover:text-indigo-600"
                title="Toggle sidebar"
              >
                <PanelRight size={18} />
              </button>
            </div>

            {/* Tablet sidebar overlay */}
            {sidebarOpen && (
              <div className="md:block xl:hidden">
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
                <div className="sidebar-collapsible open">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-slate-900">Overview</h2>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 min-h-[36px] min-w-[36px] flex items-center justify-center">
                      ✕
                    </button>
                  </div>
                  <SidebarStats user={user} />
                </div>
              </div>
            )}

            {/* Desktop sidebar - always visible */}
            <div className="hidden xl:block w-[280px] shrink-0 my-5">
              <div className="xl:sticky xl:top-20">
                <SidebarStats user={user} />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================
            Floating Progress FAB — Desktop only
        ============================================ */}
        <div className="hidden xl:block fixed bottom-6 right-6 z-50">
          <button
            onClick={() => { handleNav(screen === 'progress' ? 'feed' : 'progress') }}
            className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 ${
              screen === 'progress'
                ? 'bg-indigo-600 text-white shadow-indigo-300 scale-110'
                : 'bg-white text-indigo-600 border border-slate-200 hover:shadow-xl hover:-translate-y-0.5 shadow-indigo-100'
            }`}
            title="Progress"
          >
            <TreePine size={20} />
          </button>
        </div>

        {/* ============================================
            Tier 1: Mobile Bottom Navigation
        ============================================ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 md:hidden z-40 safe-area-bottom-nav shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-around px-1 py-1">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = screen === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => { handleNav(item.key) }}
                  className={`flex flex-col items-center justify-center gap-0 py-1.5 min-w-[44px] min-h-[48px] rounded-xl transition-all duration-200 shrink-0 native-touch ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  <div className="relative">
                    <Icon size={isActive ? 22 : 20} />
                    {item.key === 'chat' && chatUnreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-indigo-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1">
                        {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                      </span>
                    )}
                    {item.key === 'notifications' && unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold leading-tight whitespace-nowrap mt-0.5 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <LevelUpPopup />
    </LevelUpProvider>
  )
}

export default App
