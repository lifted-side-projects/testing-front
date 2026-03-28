import { getCurrentRank, type Rank } from '@/lib/gamification'

export interface LeaderboardUser {
  id: string
  name: string
  school: string
  avatarEmoji: string
  rankId: string
  masteredPercent: number
  streak: number
  coins: number
  quizzesCompleted: number
}

const MOCK_USERS: LeaderboardUser[] = [
  { id: 'm1', name: 'Ержан Касымов', school: 'НИШ ХБН Астана', avatarEmoji: '🧑‍🔬', rankId: 'professor', masteredPercent: 85, streak: 42, coins: 3200, quizzesCompleted: 68 },
  { id: 'm2', name: 'Айдана Сериккызы', school: 'Лицей №134 Алматы', avatarEmoji: '👩‍🔬', rankId: 'master', masteredPercent: 72, streak: 28, coins: 2450, quizzesCompleted: 55 },
  { id: 'm3', name: 'Дана Омарова', school: 'Гимназия №56 Шымкент', avatarEmoji: '👩‍🎓', rankId: 'master', masteredPercent: 68, streak: 35, coins: 2100, quizzesCompleted: 50 },
  { id: 'm4', name: 'Арман Жунусов', school: 'НИШ ФМН Караганда', avatarEmoji: '🧑‍🎓', rankId: 'researcher', masteredPercent: 58, streak: 19, coins: 1800, quizzesCompleted: 42 },
  { id: 'm5', name: 'Мадина Ахметова', school: 'СШ №21 Актобе', avatarEmoji: '👩‍💻', rankId: 'researcher', masteredPercent: 52, streak: 22, coins: 1650, quizzesCompleted: 38 },
  { id: 'm6', name: 'Нурсултан Байжанов', school: 'Лицей №165 Алматы', avatarEmoji: '🧑‍💻', rankId: 'researcher', masteredPercent: 48, streak: 15, coins: 1500, quizzesCompleted: 35 },
  { id: 'm7', name: 'Камила Нурланова', school: 'НИШ ХБН Алматы', avatarEmoji: '👩‍🔬', rankId: 'researcher', masteredPercent: 45, streak: 12, coins: 1350, quizzesCompleted: 30 },
  { id: 'm8', name: 'Бекзат Ермеков', school: 'СШ №5 Павлодар', avatarEmoji: '🧑‍🔬', rankId: 'assistant', masteredPercent: 32, streak: 9, coins: 980, quizzesCompleted: 24 },
  { id: 'm9', name: 'Аружан Темирова', school: 'Гимназия №3 Астана', avatarEmoji: '👩‍🎓', rankId: 'assistant', masteredPercent: 28, streak: 14, coins: 870, quizzesCompleted: 20 },
  { id: 'm10', name: 'Тимур Сагинтаев', school: 'СШ №87 Алматы', avatarEmoji: '🧑‍🎓', rankId: 'assistant', masteredPercent: 25, streak: 7, coins: 720, quizzesCompleted: 18 },
  { id: 'm11', name: 'Жанель Муратова', school: 'Лицей №38 Костанай', avatarEmoji: '👩‍💻', rankId: 'assistant', masteredPercent: 20, streak: 5, coins: 550, quizzesCompleted: 14 },
  { id: 'm12', name: 'Алихан Бекетов', school: 'СШ №14 Тараз', avatarEmoji: '🧑‍💻', rankId: 'junior_lab', masteredPercent: 12, streak: 3, coins: 320, quizzesCompleted: 8 },
  { id: 'm13', name: 'Динара Искакова', school: 'Гимназия №12 Семей', avatarEmoji: '👩‍🔬', rankId: 'junior_lab', masteredPercent: 8, streak: 2, coins: 180, quizzesCompleted: 5 },
  { id: 'm14', name: 'Самат Кенжебаев', school: 'СШ №31 Атырау', avatarEmoji: '🧑‍🔬', rankId: 'junior_lab', masteredPercent: 5, streak: 1, coins: 90, quizzesCompleted: 3 },
  { id: 'm15', name: 'Айгерим Тулепова', school: 'СШ №9 Усть-Каменогорск', avatarEmoji: '👩‍🎓', rankId: 'junior_lab', masteredPercent: 3, streak: 1, coins: 40, quizzesCompleted: 1 },
]

type SortBy = 'progress' | 'streak' | 'coins'

const SORT_FN: Record<SortBy, (a: LeaderboardUser, b: LeaderboardUser) => number> = {
  progress: (a, b) => b.masteredPercent - a.masteredPercent,
  streak: (a, b) => b.streak - a.streak,
  coins: (a, b) => b.coins - a.coins,
}

export function getLeaderboard(sortBy: SortBy): LeaderboardUser[] {
  return [...MOCK_USERS].sort(SORT_FN[sortBy])
}

export function injectCurrentUser(
  list: LeaderboardUser[],
  user: { id?: string | number; name?: string; school?: string },
  stats: { masteredPercent: number; streak: number; coins: number; quizzesCompleted: number },
): LeaderboardUser[] {
  const rank = getCurrentRank(stats.masteredPercent)
  const currentUser: LeaderboardUser = {
    id: 'current',
    name: user.name || 'Ты',
    school: user.school || '',
    avatarEmoji: rank.icon,
    rankId: rank.id,
    masteredPercent: stats.masteredPercent,
    streak: stats.streak,
    coins: stats.coins,
    quizzesCompleted: stats.quizzesCompleted,
  }

  const sortKey = list.length > 0
    ? (list[0].masteredPercent >= list[0].streak ? 'progress' : list[0].streak >= list[0].coins ? 'streak' : 'coins')
    : 'progress'

  // Insert at the right position based on what list is currently sorted by
  const result = [...list]
  const sortFn = SORT_FN[sortKey]
  let inserted = false
  for (let i = 0; i < result.length; i++) {
    if (sortFn(currentUser, result[i]) <= 0) {
      result.splice(i, 0, currentUser)
      inserted = true
      break
    }
  }
  if (!inserted) result.push(currentUser)
  return result
}

export function getSortedMetric(user: LeaderboardUser, sortBy: SortBy): string | number {
  switch (sortBy) {
    case 'progress': return `${user.masteredPercent}%`
    case 'streak': return `${user.streak} 🔥`
    case 'coins': return `${user.coins} 🪙`
  }
}
