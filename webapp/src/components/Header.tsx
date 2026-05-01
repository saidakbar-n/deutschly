import { LogOut, Home, Compass, User, BookOpen, Bell } from 'lucide-react'
import { User as UserType } from '../hooks/useApi'
import { Screen } from '../App'

type NavItem = { key: Screen; label: string }

// QA Wolf-style navigation icons
const NavIcon = ({ screen, isActive }: { screen: Screen; isActive: boolean }) => {
  const iconClass = `w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`
  
  switch (screen) {
    case 'feed':
      return <Home className={iconClass} />
    case 'search':
      return <Compass className={iconClass} />
    case 'profile':
      return <User className={iconClass} />
    case 'words':
      return <BookOpen className={iconClass} />
    case 'notifications':
      return <Bell className={iconClass} />
    default:
      return null
  }
}

// QA Wolf-style level badge
const LevelBadge = ({ level }: { level?: string }) => {
  if (!level) return null
  const levelClass = `level-badge level-${level.toLowerCase()}`
  return <span className={levelClass}>{level}</span>
}

export function Header({
  user,
  nav,
  active,
  onNav,
  onLogout,
}: {
  user: UserType
  nav: NavItem[]
  active: Screen
  onNav: (key: Screen) => void
  onLogout: () => void
}) {
  return (
    <div className="flex items-center gap-4">
      {/* Navigation Tabs */}
      <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
        {nav.map((item) => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${active === item.key 
                ? 'bg-white text-indigo-600 shadow-md' 
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
          >
            <NavIcon screen={item.key} isActive={active === item.key} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Mobile navigation dropdown */}
      <div className="md:hidden">
        <select
          className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
          value={active}
          onChange={(e) => onNav(e.target.value as Screen)}
        >
          {nav.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* User info and logout */}
      <div className="flex items-center gap-3">
        <button 
          className="p-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 
                    hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-700"
          onClick={onLogout}
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  )
}
