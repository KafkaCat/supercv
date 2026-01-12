export interface AISuggestion {
  id: string;
  original: string;
  improved: string;
  explanation: string;
}

export const analyzeContent = async (text: string, type: 'grammar' | 'tone' | 'clarity' = 'grammar'): Promise<AISuggestion[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const suggestions: AISuggestion[] = [];

  // Simple heuristics for offline demo
  
  // 1. Check for passive voice (very basic check: was/were + ed)
  const passiveRegex = /\b(was|were)\s+(\w+ed)\b/gi;
  let match;
  while ((match = passiveRegex.exec(text)) !== null) {
    suggestions.push({
      id: Math.random().toString(36).substr(2, 9),
      original: match[0],
      improved: match[0].replace(/was|were/, 'successfully'), // Very dumb replacement but demonstrates the idea
      explanation: 'Consider using active voice for stronger impact.'
    });
  }

  // 2. Check for weak words
  const weakWords = ['helped', 'worked on', 'responsible for', 'tried'];
  weakWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      suggestions.push({
        id: Math.random().toString(36).substr(2, 9),
        original: word,
        improved: 'spearheaded', // Example enhancement
        explanation: `Replace weak verb "${word}" with action-oriented words like "spearheaded", "orchestrated", or "executed".`
      });
    }
  });

  // 3. Check for capitalization (start of sentence)
  const sentences = text.split('. ');
  sentences.forEach(sentence => {
    if (sentence.length > 0 && sentence[0] !== sentence[0].toUpperCase()) {
       suggestions.push({
         id: Math.random().toString(36).substr(2, 9),
         original: sentence.substr(0, 10) + '...',
         improved: sentence.charAt(0).toUpperCase() + sentence.slice(1).substr(0, 9) + '...',
         explanation: 'Start sentences with a capital letter.'
       });
    }
  });

  if (suggestions.length === 0) {
    // Add a generic one if nothing found, just to show UI
    suggestions.push({
      id: 'demo-1',
      original: text.substring(0, 20) + '...',
      improved: text.substring(0, 20) + '... (Enhanced)',
      explanation: 'This is a demo suggestion. In a real app, an LLM would provide context-aware improvements.'
    });
  }

  return suggestions;
};
