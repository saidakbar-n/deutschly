import { LogOut, Home, Compass, BookOpen, Bell, User, PenTool, MessageCircle, Languages, StickyNote, TreePine } from 'lucide-react'
import { User as UserType } from '../hooks/useApi'
import { Screen } from '../App'

type NavItem = { key: Screen; label: string }

const NavIcon = ({ screen, isActive }: { screen: Screen; isActive: boolean }) => {
  const iconClass = `w-[18px] h-[18px] ${isActive ? 'text-indigo-600' : 'text-slate-400'}`
  
  switch (screen) {
    case 'feed': return <Home className={iconClass} />
    case 'search': return <Compass className={iconClass} />
    case 'profile': return <User className={iconClass} />
    case 'words': return <BookOpen className={iconClass} />
    case 'grammar': return <PenTool className={iconClass} />
    case 'chat': return <MessageCircle className={iconClass} />
    case 'notifications': return <Bell className={iconClass} />
    case 'translate': return <Languages className={iconClass} />
    case 'notes': return <StickyNote className={iconClass} />
    case 'progress': return <TreePine className={iconClass} />
    default: return null
  }
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
    <div className="flex items-center gap-2">
      {/* Tier 3: Desktop — full nav with labels, compact */}
      <div className="hidden xl:flex items-center gap-0.5 bg-slate-100 rounded-xl p-0.5">
        {nav.map((item) => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap
              ${active === item.key 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              }`}
          >
            <div className="relative">
              <NavIcon screen={item.key} isActive={active === item.key} />
              {item.key === 'notifications' && (unreadCount || 0) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount! > 9 ? '9+' : unreadCount}
                </span>
              )}
              {item.key === 'chat' && (chatUnreadCount || 0) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                  {chatUnreadCount! > 9 ? '9+' : chatUnreadCount}
                </span>
              )}
            </div>
            <span className="hidden 2xl:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Tier 2: Tablet — icon-only nav, scrollable */}
      <div className="md:flex xl:hidden items-center gap-0.5 overflow-x-auto scrollbar-hide scroll-soft max-w-[55vw]">
        {nav.map((item) => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className={`p-2 rounded-lg transition-all duration-200 relative shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center
              ${active === item.key 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            title={item.label}
          >
            <NavIcon screen={item.key} isActive={active === item.key} />
            {item.key === 'notifications' && (unreadCount || 0) > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                {unreadCount! > 9 ? '9+' : unreadCount}
              </span>
            )}
            {item.key === 'chat' && (chatUnreadCount || 0) > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-indigo-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                {chatUnreadCount! > 9 ? '9+' : chatUnreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="flex items-center shrink-0">
        <button 
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 
                    hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600"
          onClick={onLogout}
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}
