import { useEffect, useState, useCallback } from 'react'
import { getProgress, type ProgressData, type User } from '../hooks/useApi'
import TreeVisualization from '../components/TreeVisualization'
import {
  Flame, TrendingUp, Target, ChevronRight,
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

  useEffect(() => {
    const data = consumeLevelUp()
    if (data) setGrowthAnimation(true)
  }, [consumeLevelUp])

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
                Every action (Words, Grammar, Translate, Notes) earns XP
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
        </>
      )}
    </div>
  )
}
