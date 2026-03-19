import type { GraphPreset } from './graph-types'

const SECTION_COLOR = '#7a8ba6'

export function getSectionMeta(section: string): { color: string; short: string } {
  const short = section.replace(/^\d+\.\d+\s+/, '')
  return { color: SECTION_COLOR, short }
}

export const STATUS_COLORS = {
  mastered: { fill: '#52b788', stroke: '#40916c', glow: 'rgba(82,183,136,0.35)' },
  learning: { fill: '#e8b931', stroke: '#c99a2e', glow: 'rgba(232,185,49,0.3)' },
  unknown: { fill: '#1e2433', stroke: '#2d3548', glow: 'rgba(30,36,51,0)' },
} as const

export const STATUS_TEXT: Record<string, string> = {
  mastered: 'Изучено',
  learning: 'В процессе',
  unknown: 'Не изучено',
}

export const PHYSICS = {
  sectionCharge: -600,
  topicCharge: -120,
  sectionLinkDistance: 180,
  topicLinkDistance: 60,
  collisionPadding: 8,
  alphaDecay: 0.03,
  centerStrength: 0.05,
}

export const RENDER = {
  sectionRadius: 32,
  topicRadius: 10,
  topicRadiusMastered: 12,
  topicRadiusLearning: 11,
  zoomMin: 0.3,
  zoomMax: 4,
  tapThreshold: 5,
  labelMinScale: 0.5,
  doubleTapMs: 300,
}

export const GRAPH_PRESETS: GraphPreset[] = [
  {
    id: 'all',
    label: 'Все',
    icon: '\uD83D\uDD2C',
  },
  {
    id: 'mastered',
    label: 'Изученные',
    icon: '\u2705',
    filterTopics: (e) => e.status !== 'unknown',
  },
]
