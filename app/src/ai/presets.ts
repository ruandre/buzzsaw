export interface PromptSuggestion {
  label: string
  prompt: string
}

export const INSPIRATION_PROMPTS: readonly PromptSuggestion[] = [
  { label: 'Laser blaster', prompt: 'futuristic sci-fi laser blaster with a fast downward pitch dive' },
  { label: 'Crystal bell', prompt: 'gentle high crystal bell chime with a long resonant harmonic tail' },
  { label: '8-bit jump', prompt: 'retro arcade platformer jump with an upward square-wave sweep' },
  { label: 'Sub bass drop', prompt: 'deep cinematic sub bass drop sweeping from 160 Hz down to 38 Hz' },
  { label: 'Warp drive', prompt: 'spaceship warp drive spinning up, pitch rising then falling away' },
  { label: 'Emergency siren', prompt: 'urgent two-tone security klaxon alternating between high frequencies' },
  { label: 'Magic sparkle', prompt: 'twinkling fairy sparkle climbing through multiple sine harmonics' },
  { label: 'Wooden click', prompt: 'organic wooden button click with a micro transient attack' },
  { label: 'Cyber glitch', prompt: 'erratic digital malfunction with fast sawtooth pitch jumps' },
  { label: 'Level up', prompt: 'triumphant major triad arpeggio announcing a power-up' },
  { label: 'Bubble pop', prompt: 'liquid water droplet pop with a fast parabolic frequency arc' },
  { label: 'Brass fanfare', prompt: 'bold orchestral brass horn stab with a warm harmonic swell' },
]

export const QUICK_TRANSFORMS: readonly PromptSuggestion[] = [
  { label: 'Snappier', prompt: 'sharpen the attack to 1ms and shorten the decay into a crisp percussive click' },
  { label: 'Octave down', prompt: 'lower the pitch by one octave for a deeper bass weight' },
  { label: 'Octave up', prompt: 'raise the pitch by one octave into a bright melodic register' },
  { label: 'Arpeggio', prompt: 'turn the frequency into an ascending harmonic arpeggio' },
  { label: '8-bit', prompt: 'convert it to an 8-bit retro square wave with arcade character' },
  { label: 'Long tail', prompt: 'extend the decay and duration for a long resonant echo' },
  { label: 'Pulsing', prompt: 'add a stepped pulsing gain envelope like an urgent alarm' },
  { label: 'Pitch dive', prompt: 'add a rapid downward pitch dive from high to low' },
]
