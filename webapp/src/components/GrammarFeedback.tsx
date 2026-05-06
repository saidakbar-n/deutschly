import React from 'react'

type GrammarFeedbackProps = {
  isCorrect: boolean
  correction?: string
  explanation?: string
}

export default function GrammarFeedback({ isCorrect, correction, explanation }: GrammarFeedbackProps) {
  const [showExplanation, setShowExplanation] = React.useState(false)

  return (
    <div className={`mt-4 p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        {isCorrect ? (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </span>
      </div>
      {!isCorrect && correction && (
        <p className="text-gray-700 mb-2">
          <span className="font-medium">Correction:</span> {correction}
        </p>
      )}
      {explanation && (
        <div className="mt-2">
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            {showExplanation ? 'Hide Explanation' : 'Why?'}
          </button>
          {showExplanation && (
            <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
              {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
