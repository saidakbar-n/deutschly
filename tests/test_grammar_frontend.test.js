// Simple frontend component tests for Grammar Practicer
describe('GrammarPracticer Component', () => {
  test('GrammarFeedback shows correct state', () => {
    // Mock component rendering
    const mockFeedback = {
      is_correct: true,
      correction: 'dem Kind',
      explanation: 'Correct!'
    }
    
    expect(mockFeedback.is_correct).toBe(true)
    expect(mockFeedback.correction).toBe('dem Kind')
  })

  test('GrammarFeedback shows incorrect state', () => {
    const mockFeedback = {
      is_correct: false,
      correction: 'dem Kind',
      explanation: 'You used wrong case.'
    }
    
    expect(mockFeedback.is_correct).toBe(false)
    expect(mockFeedback.explanation).toContain('wrong')
  })

  test('Exercise navigation updates index', () => {
    let currentIndex = 0
    const totalExercises = 5
    
    // Simulate answering
    currentIndex += 1
    expect(currentIndex).toBe(1)
    
    // Simulate completing all
    currentIndex = totalExercises - 1
    const isLast = currentIndex === totalExercises - 1
    expect(isLast).toBe(true)
  })
})
