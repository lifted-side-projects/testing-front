export interface Rank {
  id: string
  title: string
  titleRu: string
  minProgress: number
  icon: string
  color: string
}

export const RANKS: Rank[] = [
  { id: 'junior_lab', title: 'Junior Lab', titleRu: 'Младший лаборант', minProgress: 0, icon: '🧪', color: '#7a8ba6' },
  { id: 'assistant', title: 'Assistant', titleRu: 'Ассистент', minProgress: 15, icon: '⚗️', color: '#52b788' },
  { id: 'researcher', title: 'Researcher', titleRu: 'Химик-исследователь', minProgress: 35, icon: '🔬', color: '#e8b931' },
  { id: 'master', title: 'Master', titleRu: 'Магистр химии', minProgress: 60, icon: '🎓', color: '#9d4edd' },
  { id: 'professor', title: 'Professor', titleRu: 'Профессор / Академик', minProgress: 85, icon: '👨‍🔬', color: '#d4a017' },
]

export function getCurrentRank(masteredPercent: number): Rank {
  let current = RANKS[0]
  for (const rank of RANKS) {
    if (masteredPercent >= rank.minProgress) {
      current = rank
    }
  }
  return current
}

export function getNextRank(masteredPercent: number): Rank | null {
  for (const rank of RANKS) {
    if (masteredPercent < rank.minProgress) {
      return rank
    }
  }
  return null
}

export function getProgressToNextRank(masteredPercent: number): number {
  const current = getCurrentRank(masteredPercent)
  const next = getNextRank(masteredPercent)
  if (!next) return 100
  const range = next.minProgress - current.minProgress
  const progress = masteredPercent - current.minProgress
  return Math.min(100, Math.round((progress / range) * 100))
}
