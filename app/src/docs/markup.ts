export interface ProseSegment {
  text: string
  /** Rendered in <code> element */
  isCode: boolean
}

const INLINE_CODE = /`([^`]+)`/g

/** Splits prose containing backticks into plain and inline-code segments */
export function parseProse(text: string): ProseSegment[] {
  const segments: ProseSegment[] = []
  let plainFrom = 0

  for (const match of text.matchAll(INLINE_CODE)) {
    if (match.index > plainFrom) {
      segments.push({ text: text.slice(plainFrom, match.index), isCode: false })
    }
    segments.push({ text: match[1], isCode: true })
    plainFrom = match.index + match[0].length
  }

  if (plainFrom < text.length) {
    segments.push({ text: text.slice(plainFrom), isCode: false })
  }
  return segments
}
