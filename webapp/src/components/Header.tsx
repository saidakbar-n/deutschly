import { Bell, Search } from 'lucide-react'

export function Header({ onSearch }: { onSearch?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-xs text-slate-500">Welcome back</p>
        <h2 className="text-xl font-semibold">Deutschly</h2>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl bg-white shadow-sm" onClick={onSearch}>
          <Search size={18} />
        </button>
        <button className="p-2 rounded-xl bg-white shadow-sm">
          <Bell size={18} />
        </button>
      </div>
    </div>
  )
}
