import type { SoundDefinition } from '@rjvr/buzzsaw'
import { MUSICAL_PITCHES as P } from './pitches'

export interface Archetype {
  id: string
  label: string
  name: string
  definition: SoundDefinition
}

export const ARCHETYPES: readonly Archetype[] = [
  {
    id: 'click',
    label: 'Click',
    name: 'crispClick',
    definition: {
      waveType: 'sine',
      frequency: 1400,
      gain: 0.3,
      duration: 0.03,
      attack: 0.001,
      decay: 0.02,
    },
  },
  {
    id: 'chime',
    label: 'Chime',
    name: 'harmonyChime',
    definition: {
      waveType: 'sine',
      frequency: {
        start: P.D5,
        steps: [
          { value: P.A5, time: 0.08 },
          { value: P.D6, time: 0.16 },
        ],
      },
      gain: 0.35,
      duration: 0.45,
      attack: 0.008,
      decay: 0.25,
    },
  },
  {
    id: 'alarm',
    label: 'Alarm',
    name: 'urgentAlarm',
    definition: {
      waveType: 'square',
      frequency: {
        start: 980,
        steps: [
          { value: 650, time: 0.1 },
          { value: 980, time: 0.2 },
          { value: 650, time: 0.3 },
        ],
      },
      gain: 0.25,
      duration: 0.4,
      attack: 0.005,
      decay: 0.05,
    },
  },
  {
    id: 'laser',
    label: 'Laser',
    name: 'plasmaLaser',
    definition: {
      waveType: 'sawtooth',
      frequency: { start: 1800, steps: [{ value: 120, time: 0.12 }] },
      gain: 0.4,
      duration: 0.14,
      attack: 0.002,
      decay: 0.08,
    },
  },
  {
    id: 'jump8bit',
    label: '8-Bit Jump',
    name: 'retroJump',
    definition: {
      waveType: 'square',
      frequency: { start: 220, steps: [{ value: 880, time: 0.12 }] },
      gain: 0.3,
      duration: 0.15,
      attack: 0.003,
      decay: 0.06,
    },
  },
  {
    id: 'subDrop',
    label: 'Sub Drop',
    name: 'subBassDrop',
    definition: {
      waveType: 'sine',
      frequency: { start: 180, steps: [{ value: 45, time: 0.35 }] },
      gain: 0.6,
      duration: 0.4,
      attack: 0.01,
      decay: 0.2,
    },
  },
  {
    id: 'powerUp',
    label: 'Power Up',
    name: 'powerLevelUp',
    definition: {
      waveType: 'triangle',
      frequency: {
        start: P.E4,
        steps: [
          { value: P.A4, time: 0.06 },
          { value: 554.37, time: 0.12 },
          { value: P.E5, time: 0.18 },
          { value: P.A5, time: 0.26 },
        ],
      },
      gain: 0.35,
      duration: 0.45,
      attack: 0.005,
      decay: 0.18,
    },
  },
  {
    id: 'glitch',
    label: 'Glitch',
    name: 'cyberGlitch',
    definition: {
      waveType: 'sawtooth',
      frequency: {
        start: 800,
        steps: [
          { value: 240, time: 0.03 },
          { value: 1200, time: 0.06 },
          { value: 180, time: 0.09 },
        ],
      },
      gain: 0.3,
      duration: 0.12,
      attack: 0.001,
      decay: 0.04,
    },
  },
  {
    id: 'pluck',
    label: 'Pluck',
    name: 'acousticPluck',
    definition: {
      waveType: 'triangle',
      frequency: P.C5,
      gain: 0.45,
      duration: 0.35,
      attack: 0.002,
      decay: 0.28,
    },
  },
]

export function findArchetype(id: string): Archetype | undefined {
  return ARCHETYPES.find(archetype => archetype.id === id)
}
