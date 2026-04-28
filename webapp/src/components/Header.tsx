import { LogOut } from 'lucide-react'
import { User } from '../hooks/useApi'
import { Screen } from '../App'

type NavItem = { key: Screen; label: string }

export function Header({
  user,
  nav,
  active,
  onNav,
  onLogout,
}: {
  user: User
  nav: NavItem[]
  active: Screen
  onNav: (key: Screen) => void
  onLogout: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Welcome back</p>
          <h2 className="text-xl font-semibold">Deutschly</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold">{user.username}</p>
            <p className="text-xs text-slate-500">{user.city || 'City?'} · {user.level}</p>
          </div>
          <button className="p-2 rounded-xl bg-white shadow-sm" onClick={onLogout} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {nav.map((item) => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              active === item.key ? 'bg-deutsch-blue text-white shadow-sm' : 'bg-white border'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
