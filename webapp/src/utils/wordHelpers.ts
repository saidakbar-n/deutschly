export function getArticleColor(term: string, isSingular: boolean): string {
  const trimmedTerm = term.trim().toLowerCase()

  if (trimmedTerm.startsWith('der ')) return 'bg-blue-100 text-blue-700'
  if (trimmedTerm.startsWith('das ')) return 'bg-green-100 text-green-700'
  if (trimmedTerm.startsWith('die ')) {
    return isSingular ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
  }
  return 'bg-yellow-100 text-yellow-800'
}

export function getWordArticleInfo(term: string, isSingular: boolean = true): { color: string; article: string } {
  const trimmedTerm = term.trim()
  const firstWord = trimmedTerm.split(' ')[0]?.toLowerCase() || ''

  if (firstWord === 'der') return { color: 'bg-blue-100 text-blue-700', article: 'der' }
  if (firstWord === 'das') return { color: 'bg-green-100 text-green-700', article: 'das' }
  if (firstWord === 'die') {
    return isSingular
      ? { color: 'bg-red-100 text-red-700', article: 'die (singular)' }
      : { color: 'bg-gray-100 text-gray-700', article: 'die (plural)' }
  }
  return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', article: '' }
}
