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
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading your Deutschly space...
      </div>
    )
  }

  if (!user) {
    return <Landing onJoin={signIn} onLogin={signInWithPassword} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <Header user={user} nav={nav} active={screen} onNav={setScreen} onLogout={signOut} />
        <div className="grid lg:grid-cols-[2fr,1fr] gap-4">
          <div className="space-y-4">
            {screen === 'feed' && <Feed user={user} />}
            {screen === 'search' && <Search />}
            {screen === 'words' && <Words user={user} />}
            {screen === 'profile' && <Profile user={user} onUpdated={setUser} />}
            {screen === 'notifications' && <Notifications />}
          </div>
          <div className="space-y-3 hidden lg:block">
            <div className="card">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Progress</p>
              <p className="text-2xl font-semibold">{user.words_count} words</p>
              <p className="text-sm text-slate-500">Keep your streak going — share a story today.</p>
            </div>
            <div className="card">
              <p className="font-semibold mb-1">{user.full_name || user.username}</p>
              <p className="text-sm text-slate-600">{user.city || 'City TBD'} · {user.level}</p>
              {user.age && <p className="text-sm text-slate-600">{user.age} years old</p>}
            </div>
            <WordPanel user={user} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
