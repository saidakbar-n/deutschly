import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

export type LevelUpInfo = {
  tree_level: number
  trees_grown: number
}

type LevelUpContextType = {
  reportLevelUp: (info: LevelUpInfo) => void
  consumeLevelUp: () => LevelUpInfo | null
  popupData: LevelUpInfo | null
  popupVisible: boolean
  dismissPopup: () => void
}

const TREE_LEVEL_NAMES = ['Seed', 'Sprout', 'Sapling', 'Young Tree', 'Blooming', 'Flourishing', 'Fruitful', 'Majestic', 'Enchanted', 'Legendary']

export function getTreeLevelName(level: number): string {
  return TREE_LEVEL_NAMES[Math.min(level, 9)] ?? 'Legendary'
}

const LevelUpContext = createContext<LevelUpContextType | null>(null)

export function LevelUpProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<LevelUpInfo | null>(null)
  const [popupData, setPopupData] = useState<LevelUpInfo | null>(null)
  const [popupVisible, setPopupVisible] = useState(false)

  const reportLevelUp = useCallback((info: LevelUpInfo) => {
    pendingRef.current = info
    setPopupData(info)
    setPopupVisible(true)
  }, [])

  const consumeLevelUp = useCallback(() => {
    const data = pendingRef.current
    pendingRef.current = null
    return data
  }, [])

  const dismissPopup = useCallback(() => {
    setPopupVisible(false)
  }, [])

  return (
    <LevelUpContext.Provider value={{ reportLevelUp, consumeLevelUp, popupData, popupVisible, dismissPopup }}>
      {children}
    </LevelUpContext.Provider>
  )
}

export function useLevelUp() {
  const ctx = useContext(LevelUpContext)
  if (!ctx) throw new Error('useLevelUp must be used within LevelUpProvider')
  return ctx
}
