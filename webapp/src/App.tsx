import { useState } from 'react'
import { Landing } from './screens/Landing'
import { Profile } from './screens/Profile'
import { Feed } from './screens/Feed'
import { Search } from './screens/Search'
import { Notifications } from './components/Notifications'

function App() {
  const [screen, setScreen] = useState<'landing' | 'profile' | 'feed' | 'search' | 'notifications'>('landing')

  const navButton = (key: typeof screen, label: string) => (
    <button
      key={key}
      onClick={() => setScreen(key)}
      className={`px-4 py-2 rounded-xl text-sm font-semibold ${screen === key ? 'bg-deutsch-blue text-white' : 'bg-white border'}`}
    >
      {label}
    </button>
  )

  const screens = {
    landing: <Landing />,
    profile: <Profile />,
    feed: <Feed />,
    search: <Search />,
    notifications: <Notifications />,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <div className="flex gap-2 sticky top-0 bg-slate-50 py-2 z-10">
          {navButton('landing', 'Home')}
          {navButton('profile', 'Profile')}
          {navButton('feed', 'Feed')}
          {navButton('search', 'Search')}
          {navButton('notifications', 'Alerts')}
        </div>
        {screens[screen]}
      </div>
    </div>
  )
}

export default App
