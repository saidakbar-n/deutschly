import { ArrowRight } from 'lucide-react'

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-700 text-white flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold">Deutschly</h1>
        <p className="text-lg text-white/90">Social-first German learning. Connect, post progress, and play mini-games.</p>
        <div className="flex flex-col gap-3">
          <a href="https://t.me/deutschly_bot" className="btn-primary flex items-center justify-center gap-2 bg-white text-blue-600">
            Open Telegram Bot <ArrowRight size={18} />
          </a>
          <a href="#app" className="border border-white/60 rounded-xl px-4 py-3 font-semibold">Open WebApp</a>
        </div>
      </div>
    </div>
  )
}
