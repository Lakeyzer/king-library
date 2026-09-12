export interface NumberMotifPart {
  text: string
  highlight: boolean
}

// Matches standalone 1999 or 19 - not preceded or followed by another digit,
// so 1987/1990/219 don't match. 1999 is checked first since it also contains
// "19" and regex alternation picks the first alternative that matches.
const NUMBER_MOTIF_PATTERN = /(?<!\d)(1999|19)(?!\d)/g

export function splitNumberMotifs(text: string): NumberMotifPart[] {
  const parts: NumberMotifPart[] = []
  let lastIndex = 0

  for (const match of text.matchAll(NUMBER_MOTIF_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), highlight: false })
    }
    parts.push({ text: match[0], highlight: true })
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false })
  }

  return parts
}
