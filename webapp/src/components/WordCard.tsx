interface WordCardProps {
  term: string
  meaning: string
  note?: string
  is_singular?: boolean
  created_at: string
  compact?: boolean
}

// Helper function to extract German article and return appropriate styling
function getArticleInfo(term: string, is_singular?: boolean): { article: string; colorClass: string; termWithoutArticle: string } {
  const trimmed = term.trim()
  const lower = trimmed.toLowerCase()
  
  // Check for articles at the start
  if (lower.startsWith('der ')) {
    return { article: 'der', colorClass: 'bg-blue-100 text-blue-700 border-blue-300', termWithoutArticle: trimmed.substring(4) }
  }
  if (lower.startsWith('die ')) {
    return is_singular !== false
      ? { article: 'die', colorClass: 'bg-red-100 text-red-700 border-red-300', termWithoutArticle: trimmed.substring(4) }
      : { article: 'die', colorClass: 'bg-gray-100 text-gray-700 border-gray-300', termWithoutArticle: trimmed.substring(4) }
  }
  if (lower.startsWith('das ')) {
    return { article: 'das', colorClass: 'bg-green-100 text-green-700 border-green-300', termWithoutArticle: trimmed.substring(4) }
  }
  
  // No article found - use black label
  return { article: '', colorClass: 'bg-slate-100 text-black border-slate-300', termWithoutArticle: trimmed }
}

export function WordCard({ term, meaning, note, is_singular, created_at, compact }: WordCardProps) {
  const { article, colorClass, termWithoutArticle } = getArticleInfo(term, is_singular)
  
  return (
    <div className={`flex items-center justify-between ${compact ? 'p-2' : 'p-3 md:p-4'} bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors`}>
      <div className="flex-1 min-w-0 flex items-start gap-3">
        {/* Article badge */}
        <span className={`flex-shrink-0 inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold border ${colorClass}`}>
          {article || '—'}
        </span>
        
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-slate-900 truncate ${compact ? 'text-sm' : 'text-base md:text-lg'}`}>{termWithoutArticle || term}</p>
          <p className={`text-slate-600 truncate ${compact ? 'text-xs' : 'text-xs md:text-sm mt-1'}`}>{meaning}</p>
          {note && <p className="text-slate-500 text-xs mt-1 italic truncate">{note}</p>}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0 ml-2 items-start">
        {is_singular !== undefined && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            is_singular ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {is_singular ? 'Singular' : 'Plural'}
          </span>
        )}
        <span className="text-xs text-slate-400 hidden sm:inline">
          {new Date(created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
