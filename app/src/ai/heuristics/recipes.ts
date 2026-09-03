import type { SoundDefinition } from '@rjvr/buzzsaw'
import { MUSICAL_PITCHES as P } from '../../audio/pitches'

export interface SoundRecipe {
  name: string
  description: string
  /** Lowercase prompt substrings selecting this recipe */
  match: readonly string[]
  /** Substrings vetoing match to avoid overlap */
  unless?: readonly string[]
  definition: SoundDefinition
}

// Evaluated top-to-bottom; first match wins, specific entries precede general ones
export const SOUND_RECIPES: readonly SoundRecipe[] = [
  {
    name: 'laserBlaster',
    description: 'Steep sawtooth pitch dive for a crisp sci-fi blast.',
    match: ['laser', 'blaster', 'ray gun', 'phaser', 'pew', 'plasma'],
    definition: {
      waveType: 'sawtooth',
      frequency: { start: 2200, steps: [{ value: 95, time: 0.12 }] },
      gain: 0.42,
      duration: 0.15,
      attack: 0.002,
      decay: 0.08,
    },
  },
  {
    name: 'arcadeExplosion',
    description: 'Crunchy 8-bit square-wave detonation with a rumbling bass collapse.',
    match: ['explosion', 'explode', 'bomb', 'detonation', 'boom', 'blast', 'crash'],
    definition: {
      waveType: 'square',
      frequency: {
        start: 190,
        steps: [
          { value: 85, time: 0.08 },
          { value: 48, time: 0.22 },
          { value: 34, time: 0.45 },
        ],
      },
      gain: 0.72,
      duration: 0.85,
      attack: 0.003,
      decay: 0.82,
    },
  },
  {
    name: 'retroJump',
    description: 'Square-wave upward pitch sweep in the classic chiptune shape.',
    match: ['8bit jump', '8-bit jump', 'retro jump', 'arcade jump', 'mario jump', 'chiptune jump', '8bit', '8-bit'],
    unless: ['explosion', 'explode', 'bomb', 'blast', 'detonation', 'boom', 'crash', 'coin', 'pickup', 'power up', 'laser', 'death', 'game over'],
    definition: {
      waveType: 'square',
      frequency: { start: 220, steps: [{ value: 880, time: 0.11 }] },
      gain: 0.32,
      duration: 0.15,
      attack: 0.002,
      decay: 0.07,
    },
  },
  {
    name: 'coinPickup',
    description: 'Bright two-tone ascending interval, the arcade pickup shape.',
    match: ['coin', 'pickup', 'gem', 'gold', 'bling', 'collect'],
    definition: {
      waveType: 'square',
      frequency: { start: P.B5, steps: [{ value: P.E6, time: 0.07 }] },
      gain: 0.35,
      duration: 0.26,
      attack: 0.003,
      decay: 0.16,
    },
  },
  {
    name: 'powerLevelUp',
    description: 'Major-triad arpeggio on a warm triangle for celebratory affirmation.',
    match: ['power up', 'powerup', 'level up', 'levelup', 'victory', 'win', 'triumph'],
    definition: {
      waveType: 'triangle',
      frequency: {
        start: P.G4,
        steps: [
          { value: P.C5, time: 0.08 },
          { value: P.E5, time: 0.16 },
          { value: P.G5, time: 0.24 },
          { value: P.C6, time: 0.34 },
        ],
      },
      gain: 0.38,
      duration: 0.48,
      attack: 0.005,
      decay: 0.22,
    },
  },
  {
    name: 'gameOver',
    description: 'Descending square-wave intervals reading as defeat.',
    match: ['game over', 'defeat', 'lose', 'death', 'fail sound'],
    definition: {
      waveType: 'square',
      frequency: {
        start: P.C4,
        steps: [
          { value: P.B3, time: 0.12 },
          { value: P.F3, time: 0.24 },
          { value: P.C3, time: 0.38 },
        ],
      },
      gain: 0.35,
      duration: 0.55,
      attack: 0.005,
      decay: 0.25,
    },
  },
  {
    name: 'cyberGlitch',
    description: 'Erratic sawtooth frequency jumps with harsh harmonic content.',
    match: ['glitch', 'cyber', 'malfunction', 'static', 'distort', 'bug'],
    definition: {
      waveType: 'sawtooth',
      frequency: {
        start: 820,
        steps: [
          { value: 180, time: 0.03 },
          { value: 1450, time: 0.06 },
          { value: 130, time: 0.10 },
        ],
      },
      gain: 0.36,
      duration: 0.14,
      attack: 0.001,
      decay: 0.05,
    },
  },
  {
    name: 'warpDriveSurge',
    description: 'Rising then falling pitch surge, like a warp engine spinning up.',
    match: ['warp', 'teleport', 'space engine', 'portal', 'hyperdrive', 'thruster'],
    definition: {
      waveType: 'triangle',
      frequency: {
        start: 120,
        steps: [
          { value: 480, time: 0.25 },
          { value: 960, time: 0.45 },
          { value: 240, time: 0.65 },
        ],
      },
      gain: 0.42,
      duration: 0.75,
      attack: 0.12,
      decay: 0.35,
    },
  },
  {
    name: 'shieldRecharge',
    description: 'Stepped ascending sine harmonics evoking an energy shield restoring.',
    match: ['shield', 'forcefield', 'barrier', 'recharge'],
    definition: {
      waveType: 'sine',
      frequency: {
        start: 220,
        steps: [
          { value: 440, time: 0.1 },
          { value: 880, time: 0.22 },
          { value: 1320, time: 0.34 },
        ],
      },
      gain: 0.36,
      duration: 0.45,
      attack: 0.02,
      decay: 0.2,
    },
  },
  {
    name: 'crystalBellChime',
    description: 'High sine harmonics with a gentle exponential tail for bell clarity.',
    match: ['crystal', 'chime', 'bell', 'glockenspiel', 'tinkle', 'wind chime'],
    definition: {
      waveType: 'sine',
      frequency: {
        start: P.A5,
        steps: [
          { value: P.E6, time: 0.08 },
          { value: P.A6, time: 0.18 },
        ],
      },
      gain: 0.36,
      duration: 0.68,
      attack: 0.005,
      decay: 0.48,
    },
  },
  {
    name: 'notificationDing',
    description: 'Crisp major-third sine chime, pleasant without being intrusive.',
    match: ['ding', 'notification', 'jingle', 'ping', 'toast', 'alert info', 'message'],
    unless: ['sonar', 'radar', 'submarine'],
    definition: {
      waveType: 'sine',
      frequency: { start: P.C6, steps: [{ value: P.E6, time: 0.06 }] },
      gain: 0.35,
      duration: 0.38,
      attack: 0.004,
      decay: 0.24,
    },
  },
  {
    name: 'magicSparkle',
    description: 'Multi-octave climbing sine ladder for celestial shimmer.',
    match: ['sparkle', 'magic', 'fairy', 'twinkle', 'celestial', 'spell', 'glimmer'],
    definition: {
      waveType: 'sine',
      frequency: {
        start: P.D5,
        steps: [
          { value: P.A5, time: 0.08 },
          { value: P.D6, time: 0.17 },
          { value: P.A6, time: 0.28 },
          { value: P.D7, time: 0.40 },
        ],
      },
      gain: 0.34,
      duration: 0.62,
      attack: 0.008,
      decay: 0.32,
    },
  },
  {
    name: 'confirmSuccess',
    description: 'Rising fourth on a warm triangle, a cheerful affirmative.',
    match: ['confirm', 'success', 'complete', 'done', 'accepted', 'check'],
    definition: {
      waveType: 'triangle',
      frequency: { start: P.E5, steps: [{ value: P.A5, time: 0.07 }] },
      gain: 0.38,
      duration: 0.22,
      attack: 0.004,
      decay: 0.12,
    },
  },
  {
    name: 'bubblePop',
    description: 'Fast parabolic sine arc giving an organic liquid pop.',
    match: ['bubble', 'pop', 'water drop', 'droplet', 'liquid'],
    definition: {
      waveType: 'sine',
      frequency: {
        start: 550,
        steps: [
          { value: 1100, time: 0.025 },
          { value: 480, time: 0.055 },
        ],
      },
      gain: 0.35,
      duration: 0.08,
      attack: 0.002,
      decay: 0.04,
    },
  },
  {
    name: 'woodenClick',
    description: 'Micro pitch drop on a triangle wave, like a struck woodblock.',
    match: ['wooden', 'woodblock', 'wood click', 'tok', 'tock', 'percussive click'],
    definition: {
      waveType: 'triangle',
      frequency: { start: 1600, steps: [{ value: 750, time: 0.015 }] },
      gain: 0.4,
      duration: 0.045,
      attack: 0.001,
      decay: 0.025,
    },
  },
  {
    name: 'crispClick',
    description: 'Micro sine transient for tactile feedback without listener fatigue.',
    match: ['click', 'tap', 'tick', 'haptic', 'button', 'switch', 'toggle', 'press'],
    definition: {
      waveType: 'sine',
      frequency: 1400,
      gain: 0.32,
      duration: 0.032,
      attack: 0.001,
      decay: 0.018,
    },
  },
  {
    name: 'cameraShutter',
    description: 'Two mechanical transients imitating an SLR shutter.',
    match: ['camera', 'shutter', 'snapshot'],
    definition: {
      waveType: 'square',
      frequency: {
        start: 2400,
        steps: [
          { value: 600, time: 0.015 },
          { value: 1800, time: 0.035 },
        ],
      },
      gain: 0.3,
      duration: 0.065,
      attack: 0.001,
      decay: 0.03,
    },
  },
  {
    name: 'subBassDrop',
    description: 'Sine sweep from low bass into chest-rumbling sub range.',
    match: ['sub ', 'sub drop', 'bass drop', '808', 'sub bass', 'heavy bass', 'sub-bass'],
    unless: ['submarine'],
    definition: {
      waveType: 'sine',
      frequency: { start: 160, steps: [{ value: 38, time: 0.45 }] },
      gain: 0.65,
      duration: 0.6,
      attack: 0.008,
      decay: 0.4,
    },
  },
  {
    name: 'heavyImpact',
    description: 'Steep kick-drum pitch drop delivering weight and punch.',
    match: ['impact', 'thud', 'slam', 'punch', 'kick', 'boom', 'stomp', 'hit'],
    definition: {
      waveType: 'sine',
      frequency: { start: 240, steps: [{ value: 45, time: 0.08 }] },
      gain: 0.65,
      duration: 0.32,
      attack: 0.002,
      decay: 0.2,
    },
  },
  {
    name: 'tensionRiser',
    description: 'Long climbing sawtooth building cinematic tension.',
    match: ['riser', 'build up', 'buildup', 'tension', 'ascend sweep', 'whoosh up'],
    definition: {
      waveType: 'sawtooth',
      frequency: {
        start: 120,
        steps: [
          { value: 480, time: 0.35 },
          { value: 1800, time: 0.7 },
        ],
      },
      gain: 0.4,
      duration: 0.85,
      attack: 0.35,
      decay: 0.2,
    },
  },
  {
    name: 'airyWhoosh',
    description: 'Smooth rise and fall giving fluid transition motion.',
    match: ['whoosh'],
    definition: {
      waveType: 'triangle',
      frequency: {
        start: 220,
        steps: [
          { value: 1200, time: 0.12 },
          { value: 350, time: 0.24 },
        ],
      },
      gain: 0.3,
      duration: 0.28,
      attack: 0.08,
      decay: 0.12,
    },
  },
  {
    name: 'airyTransition',
    description: 'Soft triangle sweep for moving between views.',
    match: ['sweep', 'transition', 'flyby', 'air'],
    unless: ['pitch', 'frequency', 'sweep down', 'sweep up', 'dive', 'drop'],
    definition: {
      waveType: 'triangle',
      frequency: {
        start: 220,
        steps: [
          { value: 1200, time: 0.12 },
          { value: 350, time: 0.24 },
        ],
      },
      gain: 0.3,
      duration: 0.28,
      attack: 0.08,
      decay: 0.12,
    },
  },
  {
    name: 'urgentAlarm',
    description: 'Alternating high-contrast sawtooth tones for maximum urgency.',
    match: ['alarm', 'siren', 'klaxon', 'emergency', 'warning', 'alert', 'danger'],
    definition: {
      waveType: 'sawtooth',
      frequency: {
        start: 980,
        steps: [
          { value: 650, time: 0.12 },
          { value: 980, time: 0.24 },
          { value: 650, time: 0.36 },
        ],
      },
      gain: 0.42,
      duration: 0.5,
      attack: 0.005,
      decay: 0.06,
    },
  },
  {
    name: 'errorBuzz',
    description: 'Low harsh sawtooth dissonance reading unmistakably as failure.',
    match: ['error', 'deny', 'invalid', 'fail', 'buzz', 'reject', 'wrong', 'forbidden'],
    definition: {
      waveType: 'sawtooth',
      frequency: { start: 180, steps: [{ value: 130, time: 0.08 }] },
      gain: 0.45,
      duration: 0.2,
      attack: 0.002,
      decay: 0.1,
    },
  },
  {
    name: 'sonarPing',
    description: 'Pure high sine ping with a long resonant tail, naval sonar style.',
    match: ['radar', 'sonar', 'submarine', 'beacon', 'ping sonar'],
    definition: {
      waveType: 'sine',
      frequency: P.A6,
      gain: 0.4,
      duration: 0.75,
      attack: 0.003,
      decay: 0.55,
    },
  },
  {
    name: 'acousticPluck',
    description: 'Percussive transient into a smooth tail, like a plucked string.',
    match: ['pluck', 'guitar', 'harp', 'koto', 'kalimba', 'marimba', 'string'],
    unless: ['sharp'],
    definition: {
      waveType: 'triangle',
      frequency: P.C5,
      gain: 0.45,
      duration: 0.4,
      attack: 0.002,
      decay: 0.32,
    },
  },
  {
    name: 'fluteTrill',
    description: 'Gentle sine trill in the register of an acoustic woodwind.',
    match: ['flute', 'whistle', 'bird', 'chirp bird', 'piccolo'],
    definition: {
      waveType: 'sine',
      frequency: {
        start: 1320,
        steps: [
          { value: 1760, time: 0.1 },
          { value: 1540, time: 0.2 },
        ],
      },
      gain: 0.35,
      duration: 0.35,
      attack: 0.03,
      decay: 0.15,
    },
  },
  {
    name: 'brassStab',
    description: 'Sawtooth timbre with a medium swell, orchestral horn stab.',
    match: ['horn', 'brass', 'trumpet', 'fanfare', 'synth brass'],
    definition: {
      waveType: 'sawtooth',
      frequency: P.D4,
      gain: 0.38,
      duration: 0.45,
      attack: 0.05,
      decay: 0.25,
    },
  },
  {
    name: 'ambientDrone',
    description: 'Slow low-frequency drift and warm sustain for a meditative bed.',
    match: ['drone', 'ambient', 'pad', 'meditation', 'space hum', 'engine hum'],
    definition: {
      waveType: 'triangle',
      frequency: {
        start: 110,
        steps: [
          { value: 115, time: 0.5 },
          { value: 108, time: 1.0 },
        ],
      },
      gain: 0.35,
      duration: 1.4,
      attack: 0.3,
      decay: 0.6,
    },
  },
]

export function findRecipe(prompt: string): SoundRecipe | undefined {
  return SOUND_RECIPES.find(recipe =>
    recipe.match.some(keyword => prompt.includes(keyword))
    && !recipe.unless?.some(keyword => prompt.includes(keyword)),
  )
}
