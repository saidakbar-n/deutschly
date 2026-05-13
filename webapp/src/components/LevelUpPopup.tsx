import { useLevelUp, getTreeLevelName } from '../contexts/LevelUpContext'
import { TreePine, Sparkles, X } from 'lucide-react'

export default function LevelUpPopup() {
  const { popupVisible, popupData, dismissPopup } = useLevelUp()

  if (!popupVisible || !popupData) return null

  const levelName = getTreeLevelName(popupData.tree_level)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismissPopup} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-qaw-fade-in-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />

        <button
          onClick={dismissPopup}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="mt-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-green-200">
            <TreePine size={40} className="text-green-600" />
          </div>
        </div>

        <div className="space-y-1 mb-6">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-2">
            {[...Array(3)].map((_, i) => (
              <Sparkles key={i} size={18} fill="currentColor" className={`animate-ping opacity-75`} style={{ animationDelay: `${i * 0.3}s`, animationDuration: '1.5s' }} />
            ))}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Level Up!</h2>
          <p className="text-slate-500">Your tree grew to</p>
          <p className="text-3xl font-bold text-gradient-indigo">{levelName}</p>
          <p className="text-sm text-slate-400">Level {popupData.tree_level}/10</p>
        </div>

        <button
          onClick={dismissPopup}
          className="w-full btn-primary py-3"
        >
          Awesome!
        </button>
      </div>
    </div>
  )
}
