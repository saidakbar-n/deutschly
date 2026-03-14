export function useUserId(defaultId = 1): number {
  const params = new URLSearchParams(window.location.search)
  const paramId = params.get('user_id')
  if (paramId) return Number(paramId)

  const tgUserId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id
  if (tgUserId) return Number(tgUserId)

  return defaultId
}
