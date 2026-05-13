import { useEffect, useState } from 'react'

const TREE_COLORS = {
  trunk: '#8B5E3C',
  trunkDark: '#6B3F2A',
  leaf: '#22C55E',
  leafDark: '#16A34A',
  leafLight: '#86EFAC',
  flower: '#F472B6',
  flowerDark: '#EC4899',
  fruit: '#F97316',
  fruitLight: '#FB923C',
  glow: '#A78BFA',
  soil: '#92400E',
  soilLight: '#B45309',
  star: '#FBBF24',
}

interface TreeVisualizationProps {
  level: number
  trees?: number
  size?: number
  animate?: boolean
  growthAnimation?: boolean
}

export default function TreeVisualization({ level, trees = 0, size = 280, animate = true, growthAnimation = false }: TreeVisualizationProps) {
  const [animClass, setAnimClass] = useState('')

  useEffect(() => {
    if (growthAnimation) {
      setAnimClass('opacity-0 scale-0 translate-y-10')
      const timer = setTimeout(() => setAnimClass('opacity-100 scale-100 translate-y-0'), 50)
      return () => clearTimeout(timer)
    } else if (animate) {
      setAnimClass('opacity-0 scale-95')
      const timer = setTimeout(() => setAnimClass('opacity-100 scale-100'), 100)
      return () => clearTimeout(timer)
    }
  }, [level, trees, animate, growthAnimation])

  const totalTrees = trees + 1
  const gardenWidth = Math.max(size, totalTrees * (size * 0.55))
  const treeSize = Math.min(size, gardenWidth / totalTrees * 0.85)
  const spacing = gardenWidth / (totalTrees + 1)

  return (
    <div className={`relative transition-all duration-700 ease-out ${growthAnimation ? 'duration-1000' : ''} ${animClass}`}>
      <svg
        width={gardenWidth}
        height={size + 30}
        viewBox={`0 0 ${gardenWidth} ${size + 30}`}
        className="w-full h-auto"
        style={{ maxWidth: gardenWidth, margin: '0 auto' }}
      >
        <defs>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={TREE_COLORS.glow} stopOpacity="0.4" />
            <stop offset="100%" stopColor={TREE_COLORS.glow} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={TREE_COLORS.trunkDark} />
            <stop offset="50%" stopColor={TREE_COLORS.trunk} />
            <stop offset="100%" stopColor={TREE_COLORS.trunkDark} />
          </linearGradient>
        </defs>

        {Array.from({ length: totalTrees }).map((_, i) => {
          const isLast = i === totalTrees - 1
          const treeLevel = isLast ? level : 9
          return <SingleTree key={i} level={treeLevel} size={treeSize} cx={spacing * (i + 1)} groundY={size - 20} animate={animate && isLast} />
        })}
      </svg>
    </div>
  )
}

function SingleTree({ level, size, cx, groundY, animate }: { level: number; size: number; cx: number; groundY: number; animate: boolean }) {
  const clampedLevel = Math.max(0, Math.min(9, level))

  return (
    <g>
      <ellipse cx={cx} cy={groundY} rx={size * 0.3} ry={6} fill={TREE_COLORS.soil} opacity={0.6} />
      {clampedLevel === 0 && (
        <text x={cx} y={groundY - 10} textAnchor="middle" fontSize={Math.min(24, size * 0.12)} dominantBaseline="central">🌱</text>
      )}

      {clampedLevel >= 8 && (
        <circle cx={cx} cy={groundY - size * 0.4} r={size * 0.35} fill="url(#glowGrad)">
          {animate && <animate attributeName="r" values={`${size * 0.3};${size * 0.38};${size * 0.3}`} dur="3s" repeatCount="indefinite" />}
        </circle>
      )}

      {clampedLevel >= 9 && Array.from({ length: 6 }).map((_, i) => (
        <text key={i} x={cx + Math.cos(i * 1.047 + 0.5) * size * 0.35} y={groundY - size * 0.4 + Math.sin(i * 1.047 + 0.5) * size * 0.3} textAnchor="middle" fontSize={Math.min(12, size * 0.06)} fill={TREE_COLORS.star} opacity={0.8}>
          ✦
          {animate && <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />}
        </text>
      ))}

      {clampedLevel >= 2 && (() => {
        const trunkH = size * (0.15 + clampedLevel * 0.025)
        const trunkW = size * (0.04 + clampedLevel * 0.008)
        return <rect x={cx - trunkW / 2} y={groundY - trunkH} width={trunkW} height={trunkH} rx={trunkW / 3} fill="url(#trunkGrad)" />
      })()}

      {clampedLevel === 1 && (
        <line x1={cx} y1={groundY} x2={cx} y2={groundY - size * 0.18} stroke={TREE_COLORS.trunk} strokeWidth={3} strokeLinecap="round" />
      )}

      {clampedLevel >= 1 && clampedLevel <= 2 && (
        <>
          <ellipse cx={cx - size * 0.06} cy={groundY - size * 0.22} rx={size * 0.07} ry={size * 0.04} fill={TREE_COLORS.leafLight} opacity={0.8} />
          <ellipse cx={cx + size * 0.06} cy={groundY - size * 0.2} rx={size * 0.07} ry={size * 0.04} fill={TREE_COLORS.leafLight} opacity={0.8} />
        </>
      )}

      {clampedLevel >= 3 && (() => {
        const canopyR = size * (0.12 + clampedLevel * 0.015)
        const canopyY = groundY - size * (0.25 + clampedLevel * 0.015)
        return (
          <>
            <ellipse cx={cx} cy={canopyY} rx={canopyR} ry={canopyR * 0.85} fill={TREE_COLORS.leafDark} opacity={0.9} />
            <ellipse cx={cx - canopyR * 0.4} cy={canopyY + canopyR * 0.1} rx={canopyR * 0.6} ry={canopyR * 0.5} fill={TREE_COLORS.leaf} opacity={0.8} />
            <ellipse cx={cx + canopyR * 0.4} cy={canopyY + canopyR * 0.1} rx={canopyR * 0.6} ry={canopyR * 0.5} fill={TREE_COLORS.leaf} opacity={0.8} />
            <ellipse cx={cx} cy={canopyY - canopyR * 0.2} rx={canopyR * 0.5} ry={canopyR * 0.4} fill={TREE_COLORS.leafLight} opacity={0.7} />
          </>
        )
      })()}

      {clampedLevel >= 4 && (() => {
        const canopyR = size * (0.12 + clampedLevel * 0.015)
        const canopyY = groundY - size * (0.25 + clampedLevel * 0.015)
        const count = clampedLevel >= 6 ? 6 : 4
        return Array.from({ length: count }).map((_, i) => {
          const angle = (i / count) * Math.PI * 2 + 0.3
          const r = canopyR * 0.6
          return (
            <circle key={i} cx={cx + Math.cos(angle) * r} cy={canopyY + Math.sin(angle) * r * 0.7} r={size * 0.015} fill={TREE_COLORS.flower} opacity={0.8}>
              {animate && <animate attributeName="opacity" values="0.5;1;0.5" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />}
            </circle>
          )
        })
      })()}

      {clampedLevel >= 6 && (() => {
        const canopyR = size * (0.12 + clampedLevel * 0.015)
        const canopyY = groundY - size * (0.25 + clampedLevel * 0.015)
        const count = clampedLevel >= 8 ? 8 : 5
        return Array.from({ length: count }).map((_, i) => {
          const angle = (i / count) * Math.PI * 2 + 1.0
          const r = canopyR * 0.65
          return <circle key={i} cx={cx + Math.cos(angle) * r} cy={canopyY + Math.sin(angle) * r * 0.6 + size * 0.01} r={size * 0.018} fill={TREE_COLORS.fruit} />
        })
      })()}

      <g opacity={0.4}>
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={i} cx={cx + (i - 4.5) * Math.min(14, size * 0.07)} cy={groundY + 18} r={Math.min(3.5, size * 0.018)} fill={i <= clampedLevel ? TREE_COLORS.leaf : '#CBD5E1'} className={animate ? 'transition-all duration-500' : ''} />
        ))}
      </g>
    </g>
  )
}
