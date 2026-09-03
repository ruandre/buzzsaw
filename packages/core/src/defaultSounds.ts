import type { SoundDefinition } from './types'

export const airRaidSiren: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 180,
    steps: [
      { value: 420, time: 0.5 },
      { value: 700, time: 1.0 },
      { value: 860, time: 1.5 },
      { value: 840, time: 1.9 },
      { value: 520, time: 2.6 },
      { value: 200, time: 3.2 },
    ],
  },
  gain: {
    start: 0.06,
    steps: [
      { value: 0.3, time: 0.6 },
      { value: 0.34, time: 1.5 },
      { value: 0.3, time: 2.2 },
      { value: 0.1, time: 3.2 },
    ],
  },
  duration: 3.4,
  attack: 0.15,
  decay: 0.3,
}

export const airyPulse: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 660,
    steps: [
      { value: 990, time: 0.05 },
      { value: 660, time: 0.1 },
    ],
  },
  gain: 0.13,
  duration: 0.12,
  attack: 0.004,
  decay: 0.06,
}

export const airySweep: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 400,
    steps: [
      { value: 1200, time: 0.13 },
    ],
  },
  gain: 0.15,
  duration: 0.15,
  attack: 0.005,
  decay: 0.07,
}

export const alarm: SoundDefinition = {
  waveType: 'square',
  frequency: 1200,
  gain: {
    start: 0.0001,
    steps: [
      { value: 0.4, time: 0.01 },
      { value: 0.0001, time: 0.15 },
      { value: 0.4, time: 0.25 },
      { value: 0.0001, time: 0.40 },
    ],
  },
  duration: 0.45,
  attack: 0,
  decay: 0,
}

export const arcadeLevelUp: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 261.63,
    steps: [
      { value: 261.63, time: 0.045 },
      { value: 329.63, time: 0.055 },
      { value: 329.63, time: 0.09 },
      { value: 392, time: 0.1 },
      { value: 392, time: 0.135 },
      { value: 523.25, time: 0.145 },
      { value: 523.25, time: 0.18 },
      { value: 659.25, time: 0.19 },
      { value: 659.25, time: 0.225 },
      { value: 783.99, time: 0.235 },
      { value: 783.99, time: 0.27 },
      { value: 1046.5, time: 0.28 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.26, time: 0.003 },
      { value: 0.001, time: 0.045 },
      { value: 0.26, time: 0.055 },
      { value: 0.001, time: 0.09 },
      { value: 0.26, time: 0.1 },
      { value: 0.001, time: 0.135 },
      { value: 0.28, time: 0.145 },
      { value: 0.001, time: 0.18 },
      { value: 0.28, time: 0.19 },
      { value: 0.001, time: 0.225 },
      { value: 0.3, time: 0.235 },
      { value: 0.001, time: 0.27 },
      { value: 0.34, time: 0.28 },
    ],
  },
  duration: 0.6,
  attack: 0.003,
  decay: 0.26,
}

export const arpeggioMajorSeventh: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 523.25,
    steps: [
      { value: 523.25, time: 0.085 },
      { value: 659.25, time: 0.1 },
      { value: 659.25, time: 0.185 },
      { value: 783.99, time: 0.2 },
      { value: 783.99, time: 0.285 },
      { value: 987.77, time: 0.3 },
      { value: 987.77, time: 0.385 },
      { value: 1046.5, time: 0.4 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.4, time: 0.004 },
      { value: 0.001, time: 0.085 },
      { value: 0.4, time: 0.1 },
      { value: 0.001, time: 0.185 },
      { value: 0.4, time: 0.2 },
      { value: 0.001, time: 0.285 },
      { value: 0.4, time: 0.3 },
      { value: 0.001, time: 0.385 },
      { value: 0.42, time: 0.4 },
    ],
  },
  duration: 0.62,
  attack: 0.004,
  decay: 0.2,
}

export const backSwipe: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 700,
    steps: [
      { value: 700, time: 0.035 },
      { value: 466.16, time: 0.045 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.24, time: 0.003 },
      { value: 0.001, time: 0.035 },
      { value: 0.26, time: 0.045 },
    ],
  },
  duration: 0.22,
  attack: 0.003,
  decay: 0.14,
}

export const bassGroove: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 55,
    steps: [
      { value: 55, time: 0.24 },
      { value: 82.41, time: 0.26 },
      { value: 82.41, time: 0.36 },
      { value: 55, time: 0.38 },
      { value: 55, time: 0.62 },
      { value: 98, time: 0.64 },
      { value: 98, time: 0.74 },
      { value: 65.41, time: 0.76 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.5, time: 0.004 },
      { value: 0.001, time: 0.12 },
      { value: 0.5, time: 0.14 },
      { value: 0.001, time: 0.24 },
      { value: 0.45, time: 0.26 },
      { value: 0.001, time: 0.36 },
      { value: 0.5, time: 0.38 },
      { value: 0.001, time: 0.5 },
      { value: 0.5, time: 0.52 },
      { value: 0.001, time: 0.62 },
      { value: 0.45, time: 0.64 },
      { value: 0.001, time: 0.74 },
      { value: 0.5, time: 0.76 },
    ],
  },
  duration: 0.98,
  attack: 0.004,
  decay: 0.16,
}

export const bossStomp: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 110,
    steps: [
      { value: 34, time: 0.16 },
      { value: 120, time: 0.2 },
      { value: 28, time: 0.5 },
    ],
  },
  gain: {
    start: 0.6,
    steps: [
      { value: 0.6, time: 0.002 },
      { value: 0.001, time: 0.17 },
      { value: 0.7, time: 0.2 },
      { value: 0.001, time: 0.52 },
    ],
  },
  duration: 0.6,
  attack: 0.002,
  decay: 0.2,
}

export const broadcastAlert: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 853,
    steps: [
      { value: 853, time: 0.1 },
      { value: 960, time: 0.105 },
      { value: 960, time: 0.2 },
      { value: 853, time: 0.205 },
      { value: 853, time: 0.3 },
      { value: 960, time: 0.305 },
      { value: 960, time: 0.4 },
      { value: 853, time: 0.405 },
      { value: 853, time: 0.5 },
      { value: 960, time: 0.505 },
      { value: 960, time: 0.6 },
      { value: 853, time: 0.605 },
      { value: 853, time: 0.7 },
      { value: 960, time: 0.705 },
      { value: 960, time: 0.8 },
    ],
  },
  gain: 0.26,
  duration: 0.9,
  attack: 0.01,
  decay: 0.08,
}

export const bubblePop: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 660,
    steps: [
      { value: 1047, time: 0.03 },
      { value: 523.25, time: 0.06 },
    ],
  },
  gain: 0.23,
  duration: 0.07,
  attack: 0.002,
  decay: 0.03,
}

export const buzz: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 220,
    steps: [
      { value: 180, time: 0.03 },
      { value: 220, time: 0.06 },
    ],
  },
  gain: 0.38,
  duration: 0.09,
  attack: 0.005,
  decay: 0.04,
}

export const chime: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 1047,
    steps: [
      { value: 1318.51, time: 0.08 },
    ],
  },
  gain: 0.35,
  duration: 0.18,
  attack: 0.01,
  decay: 0.12,
}

export const chordStabMinor: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 440,
    steps: [
      { value: 440, time: 0.016 },
      { value: 523.25, time: 0.022 },
      { value: 523.25, time: 0.038 },
      { value: 659.25, time: 0.044 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.34, time: 0.003 },
      { value: 0.001, time: 0.016 },
      { value: 0.34, time: 0.022 },
      { value: 0.001, time: 0.038 },
      { value: 0.36, time: 0.044 },
    ],
  },
  duration: 0.4,
  attack: 0.003,
  decay: 0.28,
}

export const click: SoundDefinition = {
  waveType: 'square',
  frequency: 2000,
  gain: 0.2,
  duration: 0.04,
  attack: 0.001,
  decay: 0.02,
}

export const coinCollect: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 987.77,
    steps: [
      { value: 987.77, time: 0.055 },
      { value: 1318.51, time: 0.065 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.3, time: 0.003 },
      { value: 0.001, time: 0.055 },
      { value: 0.32, time: 0.065 },
    ],
  },
  duration: 0.42,
  attack: 0.003,
  decay: 0.3,
}

export const collapse: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 523.25,
    steps: [
      { value: 392, time: 0.07 },
    ],
  },
  gain: 0.22,
  duration: 0.09,
  attack: 0.003,
  decay: 0.04,
}

export const confirm: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 659.25,
    steps: [
      { value: 880, time: 0.08 },
    ],
  },
  gain: 0.38,
  duration: 0.13,
  attack: 0.01,
  decay: 0.07,
}

export const confirmationTick: SoundDefinition = {
  waveType: 'square',
  frequency: 2200,
  gain: 0.15,
  duration: 0.035,
  attack: 0.001,
  decay: 0.015,
}

export const cosmicHum: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 80,
    steps: [
      { value: 85, time: 0.4 },
      { value: 78, time: 0.8 },
    ],
  },
  gain: 0.25,
  duration: 1.0,
  attack: 0.2,
  decay: 0.4,
}

export const cosmicSweep: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 300,
    steps: [
      { value: 1800, time: 0.18 },
    ],
  },
  gain: 0.22,
  duration: 0.2,
  attack: 0.01,
  decay: 0.09,
}

export const criticalError: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 900,
    steps: [
      { value: 450, time: 0.05 },
      { value: 1000, time: 0.1 },
      { value: 400, time: 0.15 },
    ],
  },
  gain: 0.7,
  duration: 0.18,
  attack: 0.002,
  decay: 0.08,
}

export const delicatePluck: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 1318.51,
    steps: [
      { value: 1047, time: 0.04 },
    ],
  },
  gain: 0.22,
  duration: 0.07,
  attack: 0.002,
  decay: 0.04,
}

export const deny: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 392,
    steps: [
      { value: 261.63, time: 0.09 },
    ],
  },
  gain: 0.32,
  duration: 0.13,
  attack: 0.01,
  decay: 0.07,
}

export const digitalChirp: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 1600,
    steps: [
      { value: 2200, time: 0.02 },
      { value: 1800, time: 0.05 },
    ],
  },
  gain: 0.2,
  duration: 0.06,
  attack: 0.001,
  decay: 0.03,
}

export const digitalError: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 1400,
    steps: [
      { value: 900, time: 0.03 },
      { value: 1600, time: 0.06 },
    ],
  },
  gain: {
    start: 0.35,
    steps: [
      { value: 0.1, time: 0.04 },
      { value: 0.0001, time: 0.07 },
    ],
  },
  duration: 0.08,
  attack: 0.001,
  decay: 0,
}

export const ding: SoundDefinition = {
  waveType: 'sine',
  frequency: 1174.66,
  gain: 0.32,
  duration: 0.12,
  attack: 0.01,
  decay: 0.07,
}

export const dispatchTone: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 947.4,
    steps: [
      { value: 947.4, time: 0.78 },
      { value: 1153.4, time: 0.8 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.32, time: 0.01 },
      { value: 0.001, time: 0.78 },
      { value: 0.32, time: 0.8 },
    ],
  },
  duration: 2.0,
  attack: 0.01,
  decay: 0.08,
}

export const distortedAlert: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 400,
    steps: [
      { value: 1200, time: 0.05 },
      { value: 300, time: 0.10 },
      { value: 1000, time: 0.15 },
    ],
  },
  gain: {
    start: 0.0001,
    steps: [
      { value: 0.7, time: 0.01 },
      { value: 0.2, time: 0.08 },
      { value: 0.7, time: 0.13 },
      { value: 0.0001, time: 0.18 },
    ],
  },
  duration: 0.2,
  attack: 0,
  decay: 0,
}

export const drop: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 660,
    steps: [
      { value: 440, time: 0.07 },
    ],
  },
  gain: 0.22,
  duration: 0.12,
  attack: 0.005,
  decay: 0.07,
}

export const electronicAlarm: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 1200,
    steps: [
      { value: 900, time: 0.12 },
      { value: 1200, time: 0.24 },
      { value: 900, time: 0.36 },
    ],
  },
  gain: 0.6,
  duration: 0.4,
  attack: 0.01,
  decay: 0.1,
}

export const engineHum: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 90,
    steps: [
      { value: 95, time: 0.3 },
      { value: 90, time: 0.6 },
    ],
  },
  gain: 0.4,
  duration: 0.7,
  attack: 0.15,
  decay: 0.3,
}

export const errorBuzz: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 220,
    steps: [
      { value: 180, time: 0.08 },
      { value: 220, time: 0.16 },
    ],
  },
  gain: 0.5,
  duration: 0.18,
  attack: 0.01,
  decay: 0.08,
}

export const evacuationT3: SoundDefinition = {
  waveType: 'square',
  frequency: 1000,
  gain: {
    start: 0.001,
    steps: [
      { value: 0.34, time: 0.005 },
      { value: 0.001, time: 0.5 },
      { value: 0.34, time: 1.0 },
      { value: 0.001, time: 1.5 },
      { value: 0.34, time: 2.0 },
      { value: 0.001, time: 2.5 },
    ],
  },
  duration: 2.6,
  attack: 0.005,
  decay: 0.05,
}

export const expand: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 392,
    steps: [
      { value: 523.25, time: 0.07 },
    ],
  },
  gain: 0.22,
  duration: 0.09,
  attack: 0.003,
  decay: 0.04,
}

export const failArpeggio: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 783.99,
    steps: [
      { value: 659.25, time: 0.07 },
      { value: 523.25, time: 0.14 },
    ],
  },
  gain: 0.45,
  duration: 0.22,
  attack: 0.01,
  decay: 0.08,
}

export const faintShimmer: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 1760,
    steps: [
      { value: 2093, time: 0.06 },
      { value: 1568, time: 0.12 },
    ],
  },
  gain: 0.13,
  duration: 0.14,
  attack: 0.005,
  decay: 0.07,
}

export const fallingTone: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 660,
    steps: [
      { value: 440, time: 0.15 },
    ],
  },
  gain: 0.3,
  duration: 0.18,
  attack: 0.01,
  decay: 0.08,
}

export const flatlineTone: SoundDefinition = {
  waveType: 'sine',
  frequency: 1000,
  gain: 0.24,
  duration: 2.0,
  attack: 0.01,
  decay: 0.15,
}

export const flourish: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 523.25,
    steps: [
      { value: 659.25, time: 0.06 },
      { value: 783.99, time: 0.12 },
      { value: 1047, time: 0.18 },
    ],
  },
  gain: 0.38,
  duration: 0.22,
  attack: 0.01,
  decay: 0.09,
}

export const focusShift: SoundDefinition = {
  waveType: 'triangle',
  frequency: 900,
  gain: 0.15,
  duration: 0.08,
  attack: 0.008,
  decay: 0.05,
}

export const gameOverFall: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 440,
    steps: [
      { value: 440, time: 0.13 },
      { value: 349.23, time: 0.15 },
      { value: 349.23, time: 0.31 },
      { value: 293.66, time: 0.33 },
      { value: 293.66, time: 0.52 },
      { value: 220, time: 0.55 },
      { value: 174.61, time: 1.0 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.3, time: 0.005 },
      { value: 0.001, time: 0.13 },
      { value: 0.3, time: 0.15 },
      { value: 0.001, time: 0.31 },
      { value: 0.3, time: 0.33 },
      { value: 0.001, time: 0.52 },
      { value: 0.34, time: 0.55 },
    ],
  },
  duration: 1.25,
  attack: 0.006,
  decay: 0.35,
}

export const gentleLoading: SoundDefinition = {
  waveType: 'sine',
  frequency: 500,
  gain: {
    start: 0.05,
    steps: [
      { value: 0.12, time: 0.15 },
      { value: 0.05, time: 0.30 },
    ],
  },
  duration: 0.35,
  attack: 0.05,
  decay: 0.15,
}

export const gentleRise: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 400,
    steps: [
      { value: 700, time: 0.25 },
    ],
  },
  gain: 0.18,
  duration: 0.3,
  attack: 0.04,
  decay: 0.15,
}

export const gentleSweep: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 500,
    steps: [
      { value: 900, time: 0.3 },
    ],
  },
  gain: 0.15,
  duration: 0.35,
  attack: 0.05,
  decay: 0.15,
}

export const glitchZap: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 1200,
    steps: [
      { value: 800, time: 0.03 },
      { value: 1500, time: 0.06 },
      { value: 600, time: 0.09 },
    ],
  },
  gain: 0.28,
  duration: 0.11,
  attack: 0.001,
  decay: 0.04,
}

export const grind: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 150,
    steps: [
      { value: 130, time: 0.2 },
      { value: 160, time: 0.4 },
    ],
  },
  gain: 0.55,
  duration: 0.5,
  attack: 0.05,
  decay: 0.2,
}

export const heavyStrike: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 320,
    steps: [
      { value: 90, time: 0.06 },
      { value: 70, time: 0.09 },
      { value: 180, time: 0.1 },
      { value: 48, time: 0.34 },
    ],
  },
  gain: {
    start: 0.55,
    steps: [
      { value: 0.55, time: 0.001 },
      { value: 0.05, time: 0.06 },
      { value: 0.4, time: 0.1 },
      { value: 0.001, time: 0.34 },
    ],
  },
  duration: 0.42,
  attack: 0.001,
  decay: 0.12,
}

export const heavyThump: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 70,
    steps: [
      { value: 50, time: 0.08 },
    ],
  },
  gain: 0.65,
  duration: 0.12,
  attack: 0.002,
  decay: 0.08,
}

export const highPriorityPulse: SoundDefinition = {
  waveType: 'square',
  frequency: 2000,
  gain: {
    start: 0.0001,
    steps: [
      { value: 0.6, time: 0.01 },
      { value: 0.0001, time: 0.08 },
      { value: 0.6, time: 0.12 },
      { value: 0.0001, time: 0.20 },
      { value: 0.6, time: 0.24 },
      { value: 0.0001, time: 0.32 },
    ],
  },
  duration: 0.35,
  attack: 0,
  decay: 0,
}

export const horn: SoundDefinition = {
  waveType: 'triangle',
  frequency: 440,
  gain: 0.6,
  duration: 0.6,
  attack: 0.02,
  decay: 0.3,
}

export const hornBlast: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: 330,
  gain: 0.7,
  duration: 0.7,
  attack: 0.01,
  decay: 0.4,
}

export const impact: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 100,
    steps: [
      { value: 60, time: 0.1 },
    ],
  },
  gain: 0.8,
  duration: 0.15,
  attack: 0.005,
  decay: 0.1,
}

export const infoBlip: SoundDefinition = {
  waveType: 'sine',
  frequency: 1318.51,
  gain: 0.3,
  duration: 0.11,
  attack: 0.01,
  decay: 0.07,
}

export const intenseWarning: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 1000,
    steps: [
      { value: 1500, time: 0.05 },
      { value: 1000, time: 0.1 },
      { value: 1500, time: 0.15 },
      { value: 1000, time: 0.2 },
    ],
  },
  gain: 0.6,
  duration: 0.22,
  attack: 0.005,
  decay: 0.05,
}

export const jingle: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 784,
    steps: [
      { value: 988, time: 0.06 },
      { value: 1318.51, time: 0.12 },
    ],
  },
  gain: 0.33,
  duration: 0.15,
  attack: 0.01,
  decay: 0.07,
}

export const klaxon: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 550,
    steps: [
      { value: 550, time: 0.2 },
      { value: 450, time: 0.21 },
      { value: 450, time: 0.4 },
    ],
  },
  gain: 0.65,
  duration: 0.45,
  attack: 0.01,
  decay: 0.1,
}

export const knockTap: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 180,
    steps: [
      { value: 120, time: 0.04 },
      { value: 190, time: 0.09 },
      { value: 115, time: 0.14 },
    ],
  },
  gain: {
    start: 0.45,
    steps: [
      { value: 0.45, time: 0.001 },
      { value: 0.001, time: 0.05 },
      { value: 0.4, time: 0.09 },
      { value: 0.001, time: 0.16 },
    ],
  },
  duration: 0.22,
  attack: 0.001,
  decay: 0.06,
}

export const laserShot: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 1800,
    steps: [
      { value: 400, time: 0.08 },
    ],
  },
  gain: 0.35,
  duration: 0.1,
  attack: 0.001,
  decay: 0.05,
}

export const mechanicalClick: SoundDefinition = {
  waveType: 'square',
  frequency: 2500,
  gain: 0.25,
  duration: 0.03,
  attack: 0.0005,
  decay: 0.015,
}

export const melodyMotif: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 392,
    steps: [
      { value: 392, time: 0.11 },
      { value: 523.25, time: 0.125 },
      { value: 523.25, time: 0.235 },
      { value: 659.25, time: 0.25 },
      { value: 659.25, time: 0.36 },
      { value: 587.33, time: 0.375 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.38, time: 0.005 },
      { value: 0.001, time: 0.11 },
      { value: 0.38, time: 0.125 },
      { value: 0.001, time: 0.235 },
      { value: 0.38, time: 0.25 },
      { value: 0.001, time: 0.36 },
      { value: 0.4, time: 0.375 },
    ],
  },
  duration: 0.72,
  attack: 0.005,
  decay: 0.3,
}

export const messageReceived: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 880,
    steps: [
      { value: 880, time: 0.05 },
      { value: 587.33, time: 0.06 },
      { value: 587.33, time: 0.105 },
      { value: 783.99, time: 0.115 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.22, time: 0.004 },
      { value: 0.001, time: 0.05 },
      { value: 0.22, time: 0.06 },
      { value: 0.001, time: 0.105 },
      { value: 0.24, time: 0.115 },
    ],
  },
  duration: 0.36,
  attack: 0.004,
  decay: 0.2,
}

export const messageSent: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 660,
    steps: [
      { value: 660, time: 0.045 },
      { value: 880, time: 0.055 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.22, time: 0.004 },
      { value: 0.001, time: 0.045 },
      { value: 0.24, time: 0.055 },
    ],
  },
  duration: 0.26,
  attack: 0.004,
  decay: 0.16,
}

export const metallicClink: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 2093,
    steps: [
      { value: 1760, time: 0.02 },
    ],
  },
  gain: 0.21,
  duration: 0.05,
  attack: 0.001,
  decay: 0.03,
}

export const monitorPulse: SoundDefinition = {
  waveType: 'sine',
  frequency: 1046.5,
  gain: {
    start: 0.001,
    steps: [
      { value: 0.3, time: 0.005 },
      { value: 0.001, time: 0.09 },
      { value: 0.3, time: 1.0 },
      { value: 0.001, time: 1.09 },
      { value: 0.3, time: 2.0 },
      { value: 0.001, time: 2.09 },
    ],
  },
  duration: 2.2,
  attack: 0.004,
  decay: 0.05,
}

export const mysticChime: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 1500,
    steps: [
      { value: 1800, time: 0.1 },
      { value: 1400, time: 0.2 },
      { value: 1900, time: 0.3 },
    ],
  },
  gain: 0.15,
  duration: 0.35,
  attack: 0.02,
  decay: 0.18,
}

export const notification: SoundDefinition = {
  waveType: 'triangle',
  frequency: 1568,
  gain: 0.35,
  duration: 0.13,
  attack: 0.01,
  decay: 0.08,
}

export const ping: SoundDefinition = {
  waveType: 'sine',
  frequency: 1047,
  gain: 0.4,
  duration: 0.18,
  attack: 0.01,
  decay: 0.12,
}

export const pixelJump: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 880,
    steps: [
      { value: 1174.66, time: 0.03 },
      { value: 1568, time: 0.06 },
    ],
  },
  gain: 0.32,
  duration: 0.08,
  attack: 0.002,
  decay: 0.03,
}

export const pop: SoundDefinition = {
  waveType: 'sine',
  frequency: 880,
  gain: 0.25,
  duration: 0.09,
  attack: 0.005,
  decay: 0.06,
}

export const powerDown: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 1000,
    steps: [
      { value: 200, time: 0.25 },
    ],
  },
  gain: {
    start: 0.4,
    steps: [
      { value: 0.05, time: 0.2 },
      { value: 0.0001, time: 0.28 },
    ],
  },
  duration: 0.3,
  attack: 0.01,
  decay: 0,
}

export const powerUp: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 200,
    steps: [
      { value: 1000, time: 0.25 },
    ],
  },
  gain: {
    start: 0.05,
    steps: [
      { value: 0.4, time: 0.2 },
    ],
  },
  duration: 0.3,
  attack: 0.02,
  decay: 0.1,
}

export const pulse: SoundDefinition = {
  waveType: 'square',
  frequency: 900,
  gain: {
    start: 0.0001,
    steps: [
      { value: 0.5, time: 0.02 },
      { value: 0.0001, time: 0.12 },
      { value: 0.5, time: 0.14 },
      { value: 0.0001, time: 0.24 },
    ],
  },
  duration: 0.26,
  attack: 0,
  decay: 0,
}

export const questComplete: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 523.25,
    steps: [
      { value: 523.25, time: 0.1 },
      { value: 659.25, time: 0.115 },
      { value: 659.25, time: 0.215 },
      { value: 783.99, time: 0.23 },
      { value: 783.99, time: 0.33 },
      { value: 1046.5, time: 0.35 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.36, time: 0.004 },
      { value: 0.001, time: 0.1 },
      { value: 0.38, time: 0.115 },
      { value: 0.001, time: 0.215 },
      { value: 0.4, time: 0.23 },
      { value: 0.001, time: 0.33 },
      { value: 0.44, time: 0.35 },
    ],
  },
  duration: 0.95,
  attack: 0.004,
  decay: 0.4,
}

export const question: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 523.25,
    steps: [
      { value: 659.25, time: 0.07 },
      { value: 587.33, time: 0.13 },
    ],
  },
  gain: 0.28,
  duration: 0.16,
  attack: 0.01,
  decay: 0.08,
}

export const quickSwipe: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 700,
    steps: [
      { value: 1400, time: 0.04 },
      { value: 700, time: 0.08 },
    ],
  },
  gain: 0.18,
  duration: 0.1,
  attack: 0.002,
  decay: 0.06,
}

export const ripple: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 1047,
    steps: [
      { value: 1318.51, time: 0.04 },
      { value: 1568, time: 0.08 },
    ],
  },
  gain: 0.22,
  duration: 0.11,
  attack: 0.003,
  decay: 0.05,
}

export const risingTone: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 440,
    steps: [
      { value: 660, time: 0.15 },
    ],
  },
  gain: 0.3,
  duration: 0.18,
  attack: 0.01,
  decay: 0.08,
}

export const roboticBeep: SoundDefinition = {
  waveType: 'square',
  frequency: 1000,
  gain: 0.4,
  duration: 0.1,
  attack: 0.005,
  decay: 0.05,
}

export const rustle: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 400,
    steps: [
      { value: 600, time: 0.03 },
      { value: 350, time: 0.06 },
    ],
  },
  gain: 0.12,
  duration: 0.08,
  attack: 0.002,
  decay: 0.03,
}

export const scanner: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 800,
    steps: [
      { value: 1600, time: 0.05 },
      { value: 800, time: 0.1 },
    ],
  },
  gain: 0.25,
  duration: 0.12,
  attack: 0.002,
  decay: 0.05,
}

export const sharpWarning: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: 2200,
  gain: 0.55,
  duration: 0.25,
  attack: 0.005,
  decay: 0.1,
}

export const shieldRecharge: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 220,
    steps: [
      { value: 440, time: 0.3 },
      { value: 880, time: 0.6 },
      { value: 1320, time: 0.8 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.3, time: 0.01 },
      { value: 0.05, time: 0.08 },
      { value: 0.3, time: 0.14 },
      { value: 0.05, time: 0.2 },
      { value: 0.32, time: 0.26 },
      { value: 0.05, time: 0.31 },
      { value: 0.32, time: 0.36 },
      { value: 0.05, time: 0.4 },
      { value: 0.34, time: 0.44 },
      { value: 0.05, time: 0.47 },
      { value: 0.34, time: 0.5 },
      { value: 0.05, time: 0.53 },
      { value: 0.36, time: 0.56 },
      { value: 0.05, time: 0.58 },
      { value: 0.4, time: 0.6 },
    ],
  },
  duration: 0.95,
  attack: 0.008,
  decay: 0.3,
}

export const shimmerBell: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 1760,
    steps: [
      { value: 2093, time: 0.04 },
      { value: 2637, time: 0.08 },
    ],
  },
  gain: 0.18,
  duration: 0.1,
  attack: 0.002,
  decay: 0.06,
}

export const simpleBeep: SoundDefinition = {
  waveType: 'sine',
  frequency: 880,
  gain: 0.5,
  duration: 0.3,
  attack: 0.01,
  decay: 0.2,
}

export const siren: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 600,
    steps: [
      { value: 1200, time: 0.5 },
      { value: 600, time: 1.0 },
    ],
  },
  gain: 0.3,
  duration: 1.0,
  attack: 0.05,
  decay: 0.1,
}

export const sirenHiLo: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 660,
    steps: [
      { value: 660, time: 0.44 },
      { value: 880, time: 0.46 },
      { value: 880, time: 0.9 },
      { value: 660, time: 0.92 },
      { value: 660, time: 1.36 },
      { value: 880, time: 1.38 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.26, time: 0.01 },
      { value: 0.001, time: 0.44 },
      { value: 0.26, time: 0.46 },
      { value: 0.001, time: 0.9 },
      { value: 0.26, time: 0.92 },
      { value: 0.001, time: 1.36 },
      { value: 0.26, time: 1.38 },
    ],
  },
  duration: 1.85,
  attack: 0.01,
  decay: 0.06,
}

export const sirenWail: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 600,
    steps: [
      { value: 1200, time: 0.6 },
      { value: 600, time: 1.2 },
      { value: 1200, time: 1.8 },
      { value: 600, time: 2.4 },
    ],
  },
  gain: 0.3,
  duration: 2.5,
  attack: 0.05,
  decay: 0.2,
}

export const sirenYelp: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 700,
    steps: [
      { value: 1300, time: 0.1 },
      { value: 700, time: 0.2 },
      { value: 1300, time: 0.3 },
      { value: 700, time: 0.4 },
      { value: 1300, time: 0.5 },
      { value: 700, time: 0.6 },
      { value: 1300, time: 0.7 },
      { value: 700, time: 0.8 },
      { value: 1300, time: 0.9 },
      { value: 700, time: 1.0 },
    ],
  },
  gain: 0.28,
  duration: 1.1,
  attack: 0.02,
  decay: 0.1,
}

export const smoothWhoosh: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 400,
    steps: [
      { value: 1200, time: 0.18 },
    ],
  },
  gain: 0.19,
  duration: 0.2,
  attack: 0.01,
  decay: 0.07,
}

export const softFlutter: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 1200,
    steps: [
      { value: 1400, time: 0.02 },
      { value: 1100, time: 0.04 },
      { value: 1300, time: 0.06 },
    ],
  },
  gain: 0.14,
  duration: 0.07,
  attack: 0.001,
  decay: 0.03,
}

export const spaceAmbience: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 100,
    steps: [
      { value: 110, time: 1.5 },
      { value: 95, time: 3.0 },
    ],
  },
  gain: {
    start: 0.05,
    steps: [
      { value: 0.15, time: 1.0 },
      { value: 0.08, time: 2.5 },
    ],
  },
  duration: 3.5,
  attack: 0.8,
  decay: 1.2,
}

export const staticBurst: SoundDefinition = {
  waveType: 'square',
  frequency: 4000,
  gain: {
    start: 0.0001,
    steps: [
      { value: 0.3, time: 0.005 },
      { value: 0.1, time: 0.03 },
      { value: 0.25, time: 0.04 },
      { value: 0.0001, time: 0.07 },
    ],
  },
  duration: 0.08,
  attack: 0,
  decay: 0,
}

export const subtleError: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 330,
    steps: [
      { value: 280, time: 0.1 },
    ],
  },
  gain: 0.22,
  duration: 0.15,
  attack: 0.01,
  decay: 0.08,
}

export const subtleHover: SoundDefinition = {
  waveType: 'sine',
  frequency: 1800,
  gain: 0.07,
  duration: 0.05,
  attack: 0.005,
  decay: 0.03,
}

export const subtleHum: SoundDefinition = {
  waveType: 'sine',
  frequency: 120,
  gain: 0.08,
  duration: 0.5,
  attack: 0.1,
  decay: 0.2,
}

export const successArpeggio: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 523.25,
    steps: [
      { value: 659.25, time: 0.07 },
      { value: 783.99, time: 0.14 },
    ],
  },
  gain: 0.45,
  duration: 0.22,
  attack: 0.01,
  decay: 0.08,
}

export const successChime: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 784,
    steps: [
      { value: 988, time: 0.09 },
    ],
  },
  gain: 0.5,
  duration: 0.18,
  attack: 0.01,
  decay: 0.08,
}

export const systemFailure: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 200,
    steps: [
      { value: 150, time: 0.2 },
      { value: 250, time: 0.4 },
      { value: 100, time: 0.6 },
    ],
  },
  gain: {
    start: 0.6,
    steps: [
      { value: 0.3, time: 0.3 },
      { value: 0.0001, time: 0.65 },
    ],
  },
  duration: 0.7,
  attack: 0.05,
  decay: 0,
}

export const tap: SoundDefinition = {
  waveType: 'square',
  frequency: 1500,
  gain: 0.18,
  duration: 0.045,
  attack: 0.001,
  decay: 0.02,
}

export const taskComplete: SoundDefinition = {
  waveType: 'triangle',
  frequency: {
    start: 659.25,
    steps: [
      { value: 783.99, time: 0.08 },
      { value: 1046.50, time: 0.16 },
    ],
  },
  gain: 0.35,
  duration: 0.20,
  attack: 0.01,
  decay: 0.1,
}

export const teleportBeam: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 180,
    steps: [
      { value: 520, time: 0.25 },
      { value: 1400, time: 0.5 },
      { value: 2600, time: 0.7 },
      { value: 3200, time: 0.78 },
    ],
  },
  gain: {
    start: 0.001,
    steps: [
      { value: 0.22, time: 0.006 },
      { value: 0.02, time: 0.04 },
      { value: 0.22, time: 0.07 },
      { value: 0.02, time: 0.1 },
      { value: 0.24, time: 0.13 },
      { value: 0.02, time: 0.16 },
      { value: 0.24, time: 0.19 },
      { value: 0.02, time: 0.22 },
      { value: 0.26, time: 0.25 },
      { value: 0.02, time: 0.28 },
      { value: 0.26, time: 0.31 },
      { value: 0.02, time: 0.34 },
      { value: 0.28, time: 0.38 },
      { value: 0.02, time: 0.42 },
      { value: 0.28, time: 0.46 },
      { value: 0.02, time: 0.5 },
      { value: 0.3, time: 0.55 },
      { value: 0.02, time: 0.6 },
      { value: 0.32, time: 0.66 },
    ],
  },
  duration: 0.9,
  attack: 0.006,
  decay: 0.22,
}

export const thud: SoundDefinition = {
  waveType: 'sine',
  frequency: 110,
  gain: 0.5,
  duration: 0.22,
  attack: 0.01,
  decay: 0.15,
}

export const thunk: SoundDefinition = {
  waveType: 'sine',
  frequency: 87.31,
  gain: 0.45,
  duration: 0.13,
  attack: 0.005,
  decay: 0.09,
}

export const toggle: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 523.25,
    steps: [
      { value: 659.25, time: 0.04 },
      { value: 523.25, time: 0.08 },
    ],
  },
  gain: 0.28,
  duration: 0.09,
  attack: 0.002,
  decay: 0.04,
}

export const tonalAlert: SoundDefinition = {
  waveType: 'triangle',
  frequency: 784,
  gain: 0.4,
  duration: 0.16,
  attack: 0.01,
  decay: 0.09,
}

export const twinkleTrail: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 1318.51,
    steps: [
      { value: 1568, time: 0.04 },
      { value: 2093, time: 0.08 },
    ],
  },
  gain: 0.16,
  duration: 0.1,
  attack: 0.003,
  decay: 0.05,
}

export const undoAction: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 587.33,
    steps: [
      { value: 440, time: 0.06 },
      { value: 587.33, time: 0.12 },
    ],
  },
  gain: 0.25,
  duration: 0.15,
  attack: 0.005,
  decay: 0.07,
}

export const urgentAlert: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 1800,
    steps: [
      { value: 2400, time: 0.04 },
      { value: 1800, time: 0.08 },
      { value: 2400, time: 0.12 },
      { value: 1800, time: 0.16 },
    ],
  },
  gain: {
    start: 0.0001,
    steps: [
      { value: 0.65, time: 0.01 },
      { value: 0.65, time: 0.15 },
      { value: 0.0001, time: 0.18 },
    ],
  },
  duration: 0.2,
  attack: 0,
  decay: 0,
}

export const warning: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 880,
    steps: [
      { value: 523.25, time: 0.25 },
    ],
  },
  gain: 0.4,
  duration: 0.28,
  attack: 0.01,
  decay: 0.12,
}

export const warpJump: SoundDefinition = {
  waveType: 'sawtooth',
  frequency: {
    start: 300,
    steps: [
      { value: 2500, time: 0.15 },
      { value: 500, time: 0.25 },
    ],
  },
  gain: {
    start: 0.1,
    steps: [
      { value: 0.6, time: 0.1 },
      { value: 0.0001, time: 0.28 },
    ],
  },
  duration: 0.3,
  attack: 0.01,
  decay: 0,
}

export const waterDrop: SoundDefinition = {
  waveType: 'sine',
  frequency: {
    start: 900,
    steps: [
      { value: 700, time: 0.1 },
    ],
  },
  gain: 0.28,
  duration: 0.15,
  attack: 0.01,
  decay: 0.1,
}

export const zapBlip: SoundDefinition = {
  waveType: 'square',
  frequency: {
    start: 2000,
    steps: [
      { value: 1600, time: 0.02 },
    ],
  },
  gain: 0.19,
  duration: 0.04,
  attack: 0.001,
  decay: 0.02,
}

/** Every built-in preset, keyed by name; import presets individually to tree-shake */
/// keep-sorted
export const DEFAULT_SOUNDS = {
  airRaidSiren,
  airyPulse,
  airySweep,
  alarm,
  arcadeLevelUp,
  arpeggioMajorSeventh,
  backSwipe,
  bassGroove,
  bossStomp,
  broadcastAlert,
  bubblePop,
  buzz,
  chime,
  chordStabMinor,
  click,
  coinCollect,
  collapse,
  confirm,
  confirmationTick,
  cosmicHum,
  cosmicSweep,
  criticalError,
  delicatePluck,
  deny,
  digitalChirp,
  digitalError,
  ding,
  dispatchTone,
  distortedAlert,
  drop,
  electronicAlarm,
  engineHum,
  errorBuzz,
  evacuationT3,
  expand,
  failArpeggio,
  faintShimmer,
  fallingTone,
  flatlineTone,
  flourish,
  focusShift,
  gameOverFall,
  gentleLoading,
  gentleRise,
  gentleSweep,
  glitchZap,
  grind,
  heavyStrike,
  heavyThump,
  highPriorityPulse,
  horn,
  hornBlast,
  impact,
  infoBlip,
  intenseWarning,
  jingle,
  klaxon,
  knockTap,
  laserShot,
  mechanicalClick,
  melodyMotif,
  messageReceived,
  messageSent,
  metallicClink,
  monitorPulse,
  mysticChime,
  notification,
  ping,
  pixelJump,
  pop,
  powerDown,
  powerUp,
  pulse,
  questComplete,
  question,
  quickSwipe,
  ripple,
  risingTone,
  roboticBeep,
  rustle,
  scanner,
  sharpWarning,
  shieldRecharge,
  shimmerBell,
  simpleBeep,
  siren,
  sirenHiLo,
  sirenWail,
  sirenYelp,
  smoothWhoosh,
  softFlutter,
  spaceAmbience,
  staticBurst,
  subtleError,
  subtleHover,
  subtleHum,
  successArpeggio,
  successChime,
  systemFailure,
  tap,
  taskComplete,
  teleportBeam,
  thud,
  thunk,
  toggle,
  tonalAlert,
  twinkleTrail,
  undoAction,
  urgentAlert,
  warning,
  warpJump,
  waterDrop,
  zapBlip,
} as const

export type DefaultSoundName = keyof typeof DEFAULT_SOUNDS
