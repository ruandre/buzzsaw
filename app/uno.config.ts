import { defineConfig, presetIcons, presetUno } from 'unocss'

// Colors resolve to CSS tokens in src/styles/tokens.css with dual light/dark values
function token(name: string): string {
  return `rgb(var(--bs-${name}) / <alpha-value>)`
}

const colors = {
  // Named 'canvas' instead of 'base' to avoid collision with text-base
  canvas: token('base'),
  chrome: token('chrome'),
  surface: {
    DEFAULT: token('surface'),
    raised: token('surface-raised'),
    sunken: token('surface-sunken'),
    muted: token('surface-muted'),
  },
  control: {
    DEFAULT: token('control'),
    hover: token('control-hover'),
    active: token('control-active'),
  },
  overlay: token('overlay'),
  scrim: token('scrim'),
  inverse: {
    DEFAULT: token('inverse'),
    ink: token('inverse-ink'),
  },

  taupe: {
    DEFAULT: token('taupe'),
    muted: token('taupe-muted'),
    subtle: token('taupe-subtle'),
  },

  ink: {
    DEFAULT: token('ink'),
    muted: token('ink-muted'),
    subtle: token('ink-subtle'),
    badge: token('ink-badge'),
  },

  line: {
    DEFAULT: token('line'),
    subtle: token('line-subtle'),
    strong: token('line-strong'),
    control: token('line-control'),
  },

  accent: {
    'DEFAULT': token('accent'),
    'solid': token('accent-solid'),
    'solid-hover': token('accent-solid-hover'),
    'solid-deep': token('accent-solid-deep'),
    'solid-press': token('accent-solid-press'),
    'bright': token('accent-bright'),
    'lift': token('accent-lift'),
    'press': token('accent-press'),
    'deep': token('accent-deep'),
    'ink': token('accent-ink'),
    'ink-strong': token('accent-ink-strong'),
  },

  success: token('success'),
  warning: token('warning'),
  danger: {
    DEFAULT: token('danger'),
    ink: token('danger-ink'),
    line: token('danger-line'),
    wash: token('danger-wash'),
  },
}

// Shared interactive states for focus, disabled, and active transitions without will-change
const INTERACTIVE = 'cursor-pointer select-none transition-[background-color,border-color,box-shadow,transform,color] duration-fast ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-40 disabled:pointer-events-none'
const PRESSABLE = `${INTERACTIVE} active:translate-y-px active:scale-[0.985]`

export default defineConfig({
  // Includes .ts files where UI components define UnoCSS classes dynamically
  content: {
    pipeline: {
      include: [/\.(vue|svelte|[jt]sx|mdx?|astro|html)($|\?)/, /\.ts($|\?)/],
    },
  },

  presets: [
    presetUno({ dark: 'class' }),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
        'flex-shrink': '0',
      },
    }),
  ],

  shortcuts: [
    {
      // min-w-0 prevents unbreakable child code blocks from widening container
      'layout-container': 'w-full min-w-0 max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16',

      'text-label': 'text-xs font-mono font-semibold tracking-wide',
      'text-badge': 'text-xs font-mono font-bold uppercase tracking-wider',
      'heading-view': 'font-sans text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-ink',
      'heading-section': 'text-xs font-mono font-bold uppercase tracking-wider text-ink-muted',
      'text-lede': 'mt-1 text-sm lg:text-base text-ink-muted font-sans',

      'btn-base': `${PRESSABLE} inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium font-sans border px-3.5 py-2`,
      'btn-primary': 'btn-base font-semibold text-white border-accent-deep/50 bg-gradient-to-b from-accent to-accent-solid-deep hover:from-accent-solid-hover hover:to-accent-solid-deep active:from-accent-solid-press active:to-accent-solid-press disabled:from-line disabled:to-line-control disabled:text-ink-subtle disabled:border-line disabled:shadow-none shadow-primary hover:shadow-primary-hover active:shadow-primary-active',
      'btn-secondary': 'btn-base text-ink bg-control hover:bg-control-hover active:bg-control-active border-line-control hover:border-line-strong shadow-control',
      'btn-ghost': 'btn-base border-transparent text-ink-muted hover:text-ink hover:bg-control-active px-3',
      'btn-danger': 'btn-base font-semibold text-white border-danger-ink/40 bg-danger hover:bg-danger/90 active:bg-danger/80 focus-visible:ring-danger/50 shadow-[0_1px_2px_rgb(0_0_0/0.15),inset_0_1px_0_rgb(255_255_255/0.25)]',
      'btn-danger-secondary': 'btn-base font-semibold text-danger-ink bg-control hover:bg-danger-wash active:bg-danger-wash border-danger-line hover:border-danger/50 focus-visible:ring-danger/40',
      'btn-icon': `${PRESSABLE} inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-lg text-ink-muted hover:text-ink hover:bg-control-active border border-transparent hover:border-line`,
      'filter-reset': `${PRESSABLE} h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-line-control bg-surface px-2.5 text-xs font-medium font-mono text-accent shadow-control hover:border-accent/40 hover:bg-control`,
      'chip': `${PRESSABLE} inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-muted px-2.5 py-1 text-xs font-mono text-ink-muted hover:bg-control hover:border-accent hover:text-accent-ink`,

      'surface-card': 'bg-surface border border-line rounded-xl shadow-card',
      'card-base': 'surface-card p-5 transition-[border-color,box-shadow,background-color,transform] duration-base ease-out hover:border-line-strong hover:shadow-card-hover',
      'card-interactive': 'card-base active:scale-[0.985]',
      'bezel-bay': 'bg-surface-sunken border border-line rounded-xl p-5 shadow-bezel',
      'bezel-bay-compact': 'bezel-bay p-4',

      'bevel': 'shadow-[var(--bs-bevel-top),var(--bs-bevel-bottom)]',
      'well': 'shadow-bezel',

      // Fixed height keeps header aligned across icon buttons and text stamps
      'module-header': 'flex items-center justify-between gap-3 h-11 shrink-0 border-b border-line bg-surface-sunken/60 px-4 py-1.5 sm:px-5',
      'module-title': 'select-none text-xs font-mono font-bold uppercase tracking-wider text-ink',
      'module-meta': 'select-none text-[10px] font-mono font-bold uppercase tracking-wider text-ink-subtle',
      'module-body': 'p-4 sm:p-5',

      'input-base': 'w-full min-w-0 bg-control border border-line-control rounded-lg px-3.5 py-2 text-sm font-mono text-ink placeholder-ink-subtle shadow-inset transition-colors duration-fast focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',

      // Sized to match icon buttons for alignment
      'icon-tile': 'h-8 w-8 inline-flex shrink-0 items-center justify-center rounded-lg',

      'badge-base': 'inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-mono font-semibold uppercase tracking-wider leading-none border',
      'badge-wave': 'badge-base text-ink-muted bg-surface-sunken border-line-control',
      'badge-taupe': 'badge-base text-taupe bg-taupe/10 border-taupe/20',
      'badge-count': 'inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-mono font-bold leading-none transition-colors duration-100 bg-surface-sunken text-ink-badge',
      'badge-count-active': 'inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-mono font-bold leading-none transition-colors duration-100 bg-accent/12 text-accent-ink-strong',

      'step-row': 'flex items-center gap-2 p-2.5 bg-surface-muted rounded-lg border border-line text-sm font-mono transition-colors duration-100',
      'code-block': 'min-w-0 font-mono text-sm leading-relaxed bg-surface-muted border border-line rounded-xl p-4 overflow-x-auto',
      'popover-panel': 'z-50 rounded-xl border border-line bg-overlay p-1 text-sm font-mono text-ink shadow-popover',
      'popover-item': 'relative flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors duration-100 data-[highlighted]:bg-control-hover',
      // Handles active (tabs) and on (toggle groups) Reka states
      'nav-tab': `${INTERACTIVE} flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono font-semibold whitespace-nowrap shrink-0 leading-none border-0 text-ink-muted hover:text-ink data-[state=active]:bg-control data-[state=active]:text-ink data-[state=active]:shadow-raised data-[state=on]:bg-control data-[state=on]:text-accent-ink data-[state=on]:shadow-raised`,
      'view-header': 'flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-end',
    },
  ],

  theme: {
    borderRadius: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
      bay: 'var(--radius-bay)',
      pill: 'var(--radius-pill)',
    },
    fontFamily: {
      sans: '"Instrument Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      display: '"Instrument Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      mono: '"Geist Mono Variable", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    fontSize: {
      'xs': ['0.8125rem', { 'line-height': '1.4', 'letter-spacing': '0.02em' }],
      'sm': ['0.9375rem', { 'line-height': '1.5', 'letter-spacing': '0.01em' }],
      'base': ['1rem', { 'line-height': '1.6', 'letter-spacing': '0' }],
      'lg': ['1.0625rem', { 'line-height': '1.5', 'letter-spacing': '-0.01em' }],
      'xl': ['1.25rem', { 'line-height': '1.3', 'letter-spacing': '-0.02em' }],
      '2xl': ['1.5rem', { 'line-height': '1.25', 'letter-spacing': '-0.025em' }],
      '3xl': ['1.875rem', { 'line-height': '1.15', 'letter-spacing': '-0.03em' }],
    },
    breakpoints: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    duration: {
      fast: 'var(--duration-fast)',
      base: 'var(--duration-base)',
      modal: 'var(--duration-modal)',
    },
    easing: {
      out: 'var(--ease-out)',
      spring: 'var(--ease-spring)',
    },
    boxShadow: {
      'card': 'var(--bs-shadow-card)',
      'card-hover': 'var(--bs-shadow-card-hover)',
      'control': 'var(--bs-shadow-control)',
      'popover': 'var(--bs-shadow-popover)',
      'bezel': 'var(--bs-shadow-bezel)',
      'inset': 'var(--bs-shadow-inset)',
      'raised': 'var(--bs-shadow-raised)',
      'primary': 'var(--bs-shadow-primary)',
      'primary-hover': 'var(--bs-shadow-primary-hover)',
      'primary-active': 'var(--bs-shadow-primary-active)',
    },
    colors,
  },
})
