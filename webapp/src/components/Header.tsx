import { LogOut, Home, Compass, BookOpen, Bell, User, PenTool, MessageCircle, Languages, StickyNote, TreePine } from 'lucide-react'
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
    case 'grammar':
      return <PenTool className={iconClass} />
    case 'chat':
      return <MessageCircle className={iconClass} />
    case 'notifications':
      return <Bell className={iconClass} />
    case 'translate':
      return <Languages className={iconClass} />
    case 'notes':
      return <StickyNote className={iconClass} />
    case 'progress':
      return <TreePine className={iconClass} />
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
  unreadCount,
  chatUnreadCount,
}: {
  user: UserType
  nav: NavItem[]
  active: Screen
  onNav: (key: Screen) => void
  onLogout: () => void
  unreadCount?: number
  chatUnreadCount?: number
}) {
  return (
    <div className="flex items-center gap-4">
      {/* Navigation Tabs - Visible on desktop */}
      <div className="hidden lg:flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
        {nav.map((item) => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap
              ${active === item.key 
                ? 'bg-white text-indigo-600 shadow-md' 
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
          >
              <div className="relative">
                <NavIcon screen={item.key} isActive={active === item.key} />
                {item.key === 'notifications' && (unreadCount || 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount! > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {item.key === 'chat' && (chatUnreadCount || 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {chatUnreadCount! > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </div>
              {item.label}
            </button>
          ))}
        </div>

        {/* Tablet navigation icons only - scrollable on md to lg */}
        <div className="hidden md:flex lg:hidden items-center gap-1 overflow-x-auto scrollbar-hide scroll-soft">
          {nav.map((item) => (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              className={`p-2 rounded-xl transition-all duration-200 relative
                ${active === item.key 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              title={item.label}
            >
              <NavIcon screen={item.key} isActive={active === item.key} />
              {item.key === 'notifications' && (unreadCount || 0) > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount! > 9 ? '9+' : unreadCount}
                </span>
              )}
              {item.key === 'chat' && (chatUnreadCount || 0) > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {chatUnreadCount! > 9 ? '9+' : chatUnreadCount}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => onNav('progress')}
            className={`p-2 rounded-xl transition-all duration-200 relative
              ${active === 'progress' 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            title="Progress"
          >
            <TreePine className={active === 'progress' ? 'w-5 h-5 text-indigo-600' : 'w-5 h-5 text-slate-400'} />
          </button>
        </div>

      {/* Logout */}
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
