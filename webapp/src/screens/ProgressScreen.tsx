import { useEffect, useState, useCallback } from 'react'
import { getProgress, getStarWallet, getStarPackages, purchaseStars, activatePremium, type ProgressData, type User, type StarWallet, type StarPackage } from '../hooks/useApi'
import TreeVisualization from '../components/TreeVisualization'
import {
  Flame, TrendingUp, Target, ChevronRight, ShoppingCart, Sparkles, X, Check, Crown
} from 'lucide-react'
import { useLevelUp } from '../contexts/LevelUpContext'

interface ProgressScreenProps {
  user: User
}

export default function ProgressScreen({ user }: ProgressScreenProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [growthAnimation, setGrowthAnimation] = useState(false)
  const { consumeLevelUp } = useLevelUp()
  const [wallet, setWallet] = useState<StarWallet | null>(null)
  const [packages, setPackages] = useState<StarPackage[]>([])
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [premiumLoading, setPremiumLoading] = useState(false)
  const [premiumEmoji, setPremiumEmoji] = useState("★")
  const [purchaseMsg, setPurchaseMsg] = useState('')

  useEffect(() => {
    const data = consumeLevelUp()
    if (data) setGrowthAnimation(true)
  }, [consumeLevelUp])

  useEffect(() => {
    getStarWallet(user.id).then(setWallet).catch(() => {})
    getStarPackages().then(setPackages).catch(() => {})
  }, [user.id])

  const handlePurchase = async (pkg: StarPackage) => {
    setPurchaseLoading(true)
    setPurchaseMsg('')
    try {
      const result = await purchaseStars(user.id, pkg.id)
      setWallet(prev => prev ? { ...prev, balance: result.balance } : null)
      setPurchaseMsg(`Purchased ${pkg.label}!`)
    } catch {
      setPurchaseMsg('Purchase failed')
    } finally {
      setPurchaseLoading(false)
    }
  }

  const handleActivatePremium = async () => {
    if (!wallet || wallet.balance < 100) return
    setPremiumLoading(true)
    try {
      const result = await activatePremium(user.id, premiumEmoji)
      setWallet(prev => prev ? { ...prev, premium_status: result.premium_status, premium_expires_at: result.premium_expires_at, is_premium: true, balance: result.balance } : null)
      setShowPremiumModal(false)
    } catch {
      setPurchaseMsg('Failed to activate premium')
    } finally {
      setPremiumLoading(false)
    }
  }

  const loadProgress = useCallback(async () => {
    try {
      const data = await getProgress(user.id)
      setProgress(data)
    } catch (err) {
      console.error('Failed to load progress:', err)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const pointsInCurrent = progress ? (progress.tree_points - progress.points_for_current) : 0
  const pointsRequired = progress ? (progress.points_for_next - progress.points_for_current) : 1
  const progressPct = pointsRequired > 0 ? Math.min(100, Math.round((pointsInCurrent / pointsRequired) * 100)) : 0

  return (
    <div className="space-y-4 animate-qaw-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-900">Your Progress</h2>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && progress && (
        <>
          {/* Tree Card */}
          <div className="card text-center overflow-hidden">
            <TreeVisualization level={progress.tree_level} trees={progress.trees_grown} size={260} growthAnimation={growthAnimation} />
            <div className="mt-2 space-y-1">
              <h3 className="text-2xl font-bold text-gradient-indigo">
                {progress.trees_grown > 0 ? `Tree #${progress.trees_grown + 1}` : progress.tree_stage}
              </h3>
              <p className="text-sm text-slate-500">Level {progress.tree_level}/10 {progress.trees_grown > 0 && <span className="text-indigo-400">· {progress.trees_grown} tree{progress.trees_grown > 1 ? 's' : ''} grown</span>}</p>
            </div>

            {/* Progress bar to next level */}
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{progress.tree_points} XP</span>
                <span>{progress.points_for_next} XP max</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, progressPct)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{progress.points_to_next} XP to {progress.next_stage}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card !p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Flame size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Streak</p>
                <p className="text-lg font-bold text-slate-900">{progress.streak} {progress.streak === 1 ? 'day' : 'days'}</p>
              </div>
            </div>
            <div className="card !p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total XP</p>
                <p className="text-lg font-bold text-slate-900">{progress.tree_points}</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="card !p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Target size={16} className="text-indigo-500" />
              How It Works
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <ChevronRight size={14} className="mt-0.5 text-indigo-400 flex-shrink-0" />
                Every action (Words, Grammar, Translate, Notes, Posts) earns XP
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={14} className="mt-0.5 text-indigo-400 flex-shrink-0" />
                <span><strong>Streak 3+ days</strong> gives 1.5x XP multiplier</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={14} className="mt-0.5 text-indigo-400 flex-shrink-0" />
                Watch your tree grow from a Seed to Legendary!
              </li>
            </ul>
          </div>

          {/* Stars & Premium */}
          {wallet && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-yellow-500" />
                  Stars
                  <span className="text-2xl font-bold text-yellow-500">{wallet.balance}</span>
                </h3>
                <button
              className="btn-primary text-sm py-2 px-4 min-h-[44px] native-touch"
              onClick={() => setShowStoreModal(true)}
                >
                  Get Stars
                </button>
              </div>
              {wallet.is_premium ? (
                <div className="flex items-center gap-2 bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                  <span className="text-2xl">{wallet.premium_status}</span>
                  <div>
                    <p className="font-semibold text-yellow-800 text-sm">Premium Active</p>
                    <p className="text-xs text-yellow-600">
                      Expires {wallet.premium_expires_at ? new Date(wallet.premium_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              ) : (
                <button
              className="w-full py-3 border-2 border-dashed border-yellow-300 rounded-2xl text-yellow-600 font-medium text-sm hover:bg-yellow-50 transition-colors min-h-[44px] native-touch"
              onClick={() => setShowPremiumModal(true)}
                >
                  ✦ Activate Premium Status — 100 stars / 30 days
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Store Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowStoreModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-sm w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-handle sm:hidden mb-4" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart size={18} className="text-yellow-500" />
                Star Shop
              </h3>
              <button className="p-1.5 rounded-xl hover:bg-slate-100" onClick={() => setShowStoreModal(false)}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-2">
              {packages.map(pkg => (
                <button
                  key={pkg.id}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all min-h-[44px] native-touch"
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchaseLoading}
                >
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{pkg.label}</p>
                    <p className="text-xs text-slate-400">${pkg.price_usd}</p>
                  </div>
                  <span className="text-yellow-500 font-bold">{pkg.stars} ★</span>
                </button>
              ))}
            </div>
            {purchaseMsg && (
              <p className="text-center text-sm font-medium mt-3 text-green-600">{purchaseMsg}</p>
            )}
            <p className="text-xs text-slate-400 mt-4 text-center">Simulated purchase — no real payment</p>
          </div>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowPremiumModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-sm w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-handle sm:hidden mb-4" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Crown size={18} className="text-yellow-500" />
                Activate Premium
              </h3>
              <button className="p-1.5 rounded-xl hover:bg-slate-100" onClick={() => setShowPremiumModal(false)}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              100 stars for 30 days of premium status. Choose your emoji:
            </p>
            <div className="flex gap-2 flex-wrap justify-center mb-4">
              {["⚡️", "❤️", "💘", "🐝", "★", "🧸", "💎", "🍻", "👑"].map(e => (
                <button
                  key={e}
                  className={`text-2xl p-2 rounded-xl transition-all ${
                    premiumEmoji === e ? 'bg-yellow-100 ring-2 ring-yellow-400 scale-110' : 'hover:bg-slate-100'
                  }`}
                  onClick={() => setPremiumEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
            <button
              className="w-full btn-primary flex items-center justify-center gap-2 min-h-[48px] native-touch"
              onClick={handleActivatePremium}
              disabled={premiumLoading || !wallet || wallet.balance < 100}
            >
              {premiumLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-qaw-spin" />
              ) : (
                <Check size={16} />
              )}
              Activate — 100 ★
            </button>
            {wallet && wallet.balance < 100 && (
              <p className="text-xs text-red-500 mt-2 text-center">Not enough stars. Purchase stars first.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
