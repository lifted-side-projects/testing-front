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

// Streak management
const STREAK_KEY = 'chemprep_streak'
const STREAK_DATE_KEY = 'chemprep_streak_date'
const FREEZE_KEY = 'chemprep_freezes'
const COINS_KEY = 'chemprep_coins'

export function getStreak(): number {
  return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10)
}

export function getCoins(): number {
  return parseInt(localStorage.getItem(COINS_KEY) || '0', 10)
}

export function addCoins(amount: number) {
  const current = getCoins()
  localStorage.setItem(COINS_KEY, String(current + amount))
}

export function getFreezesCount(): number {
  return parseInt(localStorage.getItem(FREEZE_KEY) || '2', 10)
}

export function useFreeze(): boolean {
  const count = getFreezesCount()
  if (count <= 0) return false
  localStorage.setItem(FREEZE_KEY, String(count - 1))
  return true
}

export function checkAndUpdateStreak(): number {
  const today = new Date().toDateString()
  const lastDate = localStorage.getItem(STREAK_DATE_KEY)
  let streak = getStreak()

  if (lastDate === today) return streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (lastDate === yesterday.toDateString()) {
    streak += 1
  } else if (lastDate) {
    // Missed a day — check freeze
    const freezes = getFreezesCount()
    if (freezes > 0) {
      localStorage.setItem(FREEZE_KEY, String(freezes - 1))
    } else {
      streak = 1
    }
  } else {
    streak = 1
  }

  localStorage.setItem(STREAK_KEY, String(streak))
  localStorage.setItem(STREAK_DATE_KEY, today)
  addCoins(streak >= 7 ? 15 : streak >= 3 ? 10 : 5)
  return streak
}

