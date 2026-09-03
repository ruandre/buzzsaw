// Studio primary views and navigation metadata

export type ViewId = 'browser' | 'creator' | 'ai' | 'custom' | 'docs'

export interface StudioView {
  id: ViewId
  /** URL path */
  path: string
  label: string
  icon: string
  /** Static badge text */
  badge?: string
  /** Highlight with accent color in navigation */
  accent?: boolean
}

export const STUDIO_VIEWS: readonly StudioView[] = [
  { id: 'browser', path: '/', label: 'Presets', icon: 'i-ph-stack-bold' },
  { id: 'creator', path: '/synth', label: 'Synth', icon: 'i-ph-sliders-bold' },
  { id: 'ai', path: '/ai', label: 'AI', icon: 'i-ph-sparkle-bold', accent: true },
  { id: 'custom', path: '/library', label: 'Library', icon: 'i-ph-archive-bold' },
  { id: 'docs', path: '/docs', label: 'Docs', icon: 'i-ph-book-open-bold' },
]

export const DEFAULT_VIEW: ViewId = 'browser'

/** Returns badge text for navigation item */
export function viewBadge(view: StudioView): string | undefined {
  return view.badge
}
