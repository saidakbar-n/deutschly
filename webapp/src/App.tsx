import { useMemo, useState } from 'react'
import { Landing } from './screens/Landing'
import { Profile } from './screens/Profile'
import { Feed } from './screens/Feed'
import { Search } from './screens/Search'
import { Words } from './screens/Words'
import { Notifications } from './components/Notifications'
import { WordPanel } from './components/WordPanel'
import { useSession } from './hooks/useSession'
import { Header } from './components/Header'
import { WolfLogo } from './components/WolfIllustrations'

import type { User } from './hooks/useApi'

export type Screen = 'feed' | 'profile' | 'search' | 'words' | 'notifications'

function App() {
  const { user, loading, signIn, signInWithPassword, signOut, refresh, setUser } = useSession()
  const [screen, setScreen] = useState<Screen>('feed')

  const nav = useMemo(
    () => [
      { key: 'feed' as Screen, label: 'Feed' },
      { key: 'search' as Screen, label: 'Discover' },
      { key: 'profile' as Screen, label: 'Profile' },
      { key: 'words' as Screen, label: 'Words' },
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

  return (
    <div className="min-h-screen hero-bg">
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
              onNav={setScreen} 
              onLogout={signOut} 
            />
          </div>
        </header>

        {/* ============================================
            Main Content Grid
        ============================================ */}
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          
          {/* Main Content Area */}
          <div className="space-y-6">
            <div className="card animate-qaw-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {screen === 'feed' && <Feed user={user} />}
              {screen === 'search' && <Search />}
              {screen === 'words' && <Words user={user} />}
              {screen === 'profile' && <Profile user={user} onUpdated={setUser} />}
              {screen === 'notifications' && <Notifications />}
            </div>
          </div>

          {/* ============================================
              Sidebar - QA Wolf Style Cards
          ============================================ */}
          <div className="space-y-4 hidden lg:block">
            
            {/* User Progress Card */}
            <div className="card animate-qaw-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-sky-100 rounded-2xl flex items-center justify-center">
                  <WolfLogo className="w-10 h-10" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{user.full_name || user.username}</p>
                  <p className="text-sm text-slate-600">
                    {user.city || 'City TBD'} · <span className={`level-badge level-${user.level.toLowerCase()}`}>{user.level}</span>
                  </p>
                  {user.age && <p className="text-sm text-slate-600">{user.age} years old</p>}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-indigo-50 to-sky-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-700">{user.words_count}</p>
                  <p className="text-sm text-indigo-600 font-medium">words learned</p>
                </div>
                
                <p className="text-sm text-slate-500 text-center">
                  Keep your streak going — share a story today.
                </p>
              </div>
            </div>

            {/* Word Panel */}
            <div className="card animate-qaw-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <WordPanel user={user} />
            </div>

            {/* Quick Stats */}
            <div className="card animate-qaw-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3 L15 9 L21 12 L15 15 L12 21 L9 15 L3 12 L9 9 L12 3" />
                </svg>
                Learning Stats
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Posts', value: user.posts_count || 0 },
                  { label: 'Followers', value: user.followers_count || 0 },
                  { label: 'Following', value: user.following_count || 0 },
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
            <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-0 animate-qaw-fade-in-up" style={{ animationDelay: '0.8s' }}>
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
    </div>
  )
}

export default App
