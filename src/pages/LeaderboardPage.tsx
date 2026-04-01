import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { getCurrentRank } from '@/lib/gamification'
import { getLeaderboard, injectCurrentUser, getSortedMetric, type LeaderboardUser } from '@/data/leaderboardMock'
import { PageShell } from '@/components/PageShell'
import { cn } from '@/lib/utils'
import { ArrowLeft, Trophy } from 'lucide-react'

type SortBy = 'progress' | 'streak' | 'coins'

const TABS: { key: SortBy; label: string }[] = [
  { key: 'progress', label: 'Прогресс' },
  { key: 'streak', label: 'Стрик' },
  { key: 'coins', label: 'Монеты' },
]

export function LeaderboardPage() {
  const navigate = useNavigate()
  const user = getUser()
  const { data: gamification } = useQuery({
    queryKey: ['gamification'],
    queryFn: api.getGamification,
  })
  const streak = gamification?.streak ?? 0
  const coins = gamification?.coins ?? 0
  const [sortBy, setSortBy] = useState<SortBy>('progress')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: api.getKnowledgeStats,
  })

  const masteredPercent = stats ? Math.round((stats.mastered / stats.total) * 100) : 0

  const leaderboard = useMemo(() => {
    const list = getLeaderboard(sortBy)
    if (!stats) return list
    return injectCurrentUser(list, { id: user?.id, name: user?.name }, {
      masteredPercent,
      streak,
      coins,
      quizzesCompleted: stats.mastered,
    })
  }, [sortBy, stats, masteredPercent, streak, coins, user?.id, user?.name])

  const top3 = leaderboard.slice(0, 3)
  const currentUserIdx = leaderboard.findIndex(u => u.id === 'current')
  const rest = leaderboard.slice(3)

  if (isLoading) {
    return (
      <PageShell>
        <div className="px-5 pt-6 page-enter">
          <div className="flex items-center gap-3 mb-6">
            <div className="skeleton h-9 w-9 rounded-xl" />
            <div className="skeleton h-7 w-28" />
          </div>
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-9 flex-1 rounded-full" />)}
          </div>
          <div className="skeleton h-52 rounded-2xl mb-5" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="px-5 pt-6 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-ink-800/60 border border-ink-700/30 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-ink-300" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" />
            <h1 className="font-display text-xl font-bold text-ink-50">Рейтинг</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSortBy(tab.key)}
              className={cn(
                'flex-1 py-2 px-3 rounded-full text-xs font-semibold transition-colors',
                sortBy === tab.key
                  ? 'bg-amber-400 text-ink-950'
                  : 'bg-ink-800 text-ink-300 border border-ink-700/30'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Podium */}
        {top3.length >= 3 && <Podium users={top3} sortBy={sortBy} currentUserId="current" />}

        {/* Current user card (if not in top 3) */}
        {currentUserIdx >= 3 && (
          <div className="bg-amber-400/10 border-2 border-amber-400/30 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-ink-300 text-sm font-mono font-bold w-7 text-center">
              {currentUserIdx + 1}
            </span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-amber-400/15 border border-amber-400/25">
              {getCurrentRank(masteredPercent).icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 text-sm font-semibold truncate">{user?.name || 'Ты'}</p>
              <p className="text-ink-500 text-xs truncate">{getCurrentRank(masteredPercent).titleRu}</p>
            </div>
            <span className="text-amber-300 text-sm font-mono font-bold shrink-0">
              {getSortedMetric(leaderboard[currentUserIdx], sortBy)}
            </span>
          </div>
        )}

        {/* Rest of the list */}
        <div className="space-y-2 mb-8">
          {rest.map((u, i) => {
            const rank = getCurrentRank(u.masteredPercent)
            const position = i + 4
            const isCurrentUser = u.id === 'current'

            if (isCurrentUser) return null // already shown above

            return (
              <div
                key={u.id}
                className="bg-ink-800/40 border border-ink-700/30 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <span className="text-ink-500 text-sm font-mono font-bold w-7 text-center">
                  {position}
                </span>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ background: `${rank.color}15`, border: `1px solid ${rank.color}25` }}
                >
                  {u.avatarEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ink-200 text-sm font-medium truncate">{u.name}</p>
                  <p className="text-ink-500 text-xs truncate">{u.school}</p>
                </div>
                <span className="text-ink-300 text-sm font-mono shrink-0">
                  {getSortedMetric(u, sortBy)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}

/* ---- Podium Component ---- */

function Podium({ users, sortBy, currentUserId }: { users: LeaderboardUser[]; sortBy: SortBy; currentUserId: string }) {
  // Display order: [2nd, 1st, 3rd]
  const [first, second, third] = users
  const podiumOrder = [second, first, third]
  const medals = ['🥈', '🥇', '🥉']
  const heights = ['h-24', 'h-32', 'h-20']
  const accentColors = [
    { bg: 'bg-ink-700/40', border: 'border-ink-500/30', text: 'text-ink-300' },      // silver
    { bg: 'bg-amber-400/15', border: 'border-amber-400/30', text: 'text-amber-300' }, // gold
    { bg: 'bg-coral-500/10', border: 'border-coral-500/25', text: 'text-coral-300' }, // bronze
  ]

  return (
    <div className="flex items-end justify-center gap-3 mb-6 pt-4">
      {podiumOrder.map((u, i) => {
        const rank = getCurrentRank(u.masteredPercent)
        const isFirst = i === 1
        const isCurrentUser = u.id === currentUserId
        const accent = accentColors[i]

        return (
          <div key={u.id} className="flex flex-col items-center flex-1">
            {/* Avatar */}
            <div className={cn(
              'rounded-2xl flex items-center justify-center mb-2 border-2',
              isFirst ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-xl',
              isCurrentUser ? 'border-amber-400/50' : 'border-transparent',
            )} style={{
              background: `${rank.color}15`,
              borderColor: isCurrentUser ? undefined : `${rank.color}30`,
            }}>
              {u.avatarEmoji}
            </div>

            {/* Medal */}
            <span className={cn('text-lg mb-1', isFirst && 'text-2xl')}>{medals[i]}</span>

            {/* Name */}
            <p className={cn(
              'text-xs font-semibold truncate max-w-full text-center',
              isCurrentUser ? 'text-amber-300' : 'text-ink-200',
            )}>
              {u.name}
            </p>
            <p className="text-[10px] text-ink-500 truncate max-w-full text-center leading-tight mt-0.5">
              {u.school}
            </p>

            {/* Metric */}
            <p className={cn('text-[11px] font-mono mt-0.5', accent.text)}>
              {getSortedMetric(u, sortBy)}
            </p>

            {/* Podium pillar */}
            <div className={cn(
              'w-full rounded-t-xl mt-2 border-t border-x',
              heights[i],
              accent.bg,
              accent.border,
            )} />
          </div>
        )
      })}
    </div>
  )
}
