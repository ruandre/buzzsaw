export const UI_SOUNDS = {
  navigate: 'airySweep',
  open: 'pop',
  logoHover: 'cosmicHum',
  dismiss: 'thunk',
  expand: 'expand',
  collapse: 'collapse',
  select: 'tap',
  toggle: 'toggle',
  randomize: 'zapBlip',
  undo: 'undoAction',
  discard: 'drop',
  scrollTop: 'quickSwipe',
  save: 'confirmationTick',
  copy: 'metallicClink',
  export: 'taskComplete',
  starOn: 'twinkleTrail',
  starOff: 'delicatePluck',
  error: 'subtleError',
} as const

export type UiSound = keyof typeof UI_SOUNDS
