export interface GlitchLetterPart {
  text: string
  glitch: boolean
}

// Splits text into runs, marking every occurrence of the given letter
// (case-insensitive) as its own glitched part.
export function splitGlitchLetter(text: string, letter: string): GlitchLetterPart[] {
  const pattern = new RegExp(letter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  const parts: GlitchLetterPart[] = []
  let lastIndex = 0

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), glitch: false })
    }
    parts.push({ text: match[0], glitch: true })
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), glitch: false })
  }

  return parts
}
