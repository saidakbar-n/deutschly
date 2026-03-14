import { useEffect, useMemo } from 'react'

declare global {
  interface Window {
    Telegram?: { WebApp?: any }
  }
}

export function useTelegram() {
  const tg = window.Telegram?.WebApp

  useEffect(() => {
    if (!tg) return
    tg.expand()
    tg.MainButton?.setText('Create Post')?.show()
    return () => tg.MainButton?.hide()
  }, [tg])

  const theme = tg?.colorScheme === 'dark' ? 'dark' : 'light'

  return useMemo(
    () => ({
      tg,
      theme,
      isTelegram: Boolean(tg),
    }),
    [tg, theme]
  )
}
