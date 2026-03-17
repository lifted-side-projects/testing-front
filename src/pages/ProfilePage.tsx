import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { getUser, clearAuth } from '@/lib/auth'
import {
  getCurrentRank, getNextRank, getProgressToNextRank, RANKS,
  getStreak, getCoins, getFreezesCount,
} from '@/lib/gamification'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'
import {
  Flame, Snowflake, Coins, LogOut,
  TrendingUp, Award, Crown,
} from 'lucide-react'

export function ProfilePage() {
  const navigate = useNavigate()
  const user = getUser()
  const streak = getStreak()
  const coins = getCoins()
  const freezes = getFreezesCount()

  const { data: stats } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: api.getKnowledgeStats,
  })

  const masteredPercent = stats ? Math.round((stats.mastered / stats.total) * 100) : 0
  const rank = getCurrentRank(masteredPercent)
  const nextRank = getNextRank(masteredPercent)
  const rankProgress = getProgressToNextRank(masteredPercent)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <PageShell>
      <div className="px-5 pt-6 page-enter">
        {/* Profile header */}
        <div className="text-center mb-6">
          {/* Avatar */}
          <div className="relative mx-auto w-20 h-20 mb-3">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border-2"
              style={{
                background: `${rank.color}15`,
                borderColor: `${rank.color}30`,
              }}
            >
              {rank.icon}
            </div>
            {/* Rank badge */}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border-2 border-ink-950"
              style={{ background: rank.color }}
            >
              <Award size={14} className="text-ink-950" />
            </div>
          </div>

          <h1 className="font-display text-xl font-bold text-ink-50">{user?.name}</h1>
          <p className="text-sm mt-0.5" style={{ color: rank.color }}>{rank.titleRu}</p>
          <p className="text-ink-500 text-xs mt-0.5">{user?.email}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-coral-500/10 border border-coral-500/15 rounded-xl p-3 text-center">
            <Flame size={18} className="text-coral-400 mx-auto mb-1" />
            <div className="font-display text-lg font-bold text-coral-300">{streak}</div>
            <div className="text-ink-500 text-[10px] uppercase">Стрик</div>
          </div>
          <div className="bg-amber-400/10 border border-amber-400/15 rounded-xl p-3 text-center">
            <Coins size={18} className="text-amber-400 mx-auto mb-1" />
            <div className="font-display text-lg font-bold text-amber-300">{coins}</div>
            <div className="text-ink-500 text-[10px] uppercase">Монеты</div>
          </div>
          <div className="bg-blue-400/10 border border-blue-400/15 rounded-xl p-3 text-center">
            <Snowflake size={18} className="text-blue-400 mx-auto mb-1" />
            <div className="font-display text-lg font-bold text-blue-300">{freezes}</div>
            <div className="text-ink-500 text-[10px] uppercase">Заморозки</div>
          </div>
        </div>

        {/* Rank progression */}
        <div className="bg-ink-800/40 border border-ink-700/30 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={16} className="text-amber-400" />
            <h3 className="text-ink-200 text-sm font-semibold">Иерархия рангов</h3>
          </div>

          <div className="space-y-3">
            {RANKS.map((r) => {
              const isCurrent = r.id === rank.id
              const isAchieved = masteredPercent >= r.minProgress
              return (
                <div key={r.id} className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all',
                    isCurrent ? 'scale-110 shadow-lg' : '',
                    isAchieved ? '' : 'opacity-30 grayscale'
                  )} style={{
                    background: isAchieved ? `${r.color}20` : undefined,
                    border: isCurrent ? `2px solid ${r.color}` : isAchieved ? `1px solid ${r.color}30` : '1px solid #232a3f',
                  }}>
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'text-sm font-medium',
                        isCurrent ? 'text-ink-50' : isAchieved ? 'text-ink-300' : 'text-ink-600'
                      )}>
                        {r.titleRu}
                      </span>
                      <span className="text-ink-500 text-xs font-mono">{r.minProgress}%</span>
                    </div>
                    {isCurrent && nextRank && (
                      <div className="mt-1">
                        <div className="h-1 bg-ink-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${rankProgress}%`, background: r.color }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Knowledge breakdown */}
        {stats && (
          <div className="bg-ink-800/40 border border-ink-700/30 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-sage-400" />
              <h3 className="text-ink-200 text-sm font-semibold">Прогресс по классам</h3>
            </div>

            <div className="space-y-3">
              {Object.entries(stats.byGrade).map(([grade, data]) => {
                const pct = data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0
                return (
                  <div key={grade}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-ink-300">{grade} класс</span>
                      <span className="text-ink-500 font-mono">{data.mastered}/{data.total}</span>
                    </div>
                    <div className="h-2 bg-ink-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? '#52b788' : pct >= 40 ? '#e8b931' : '#e76f51',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Buy freeze */}
        <div className="bg-blue-400/5 border border-blue-400/15 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <Snowflake size={24} className="text-blue-400 shrink-0" />
          <div className="flex-1">
            <p className="text-ink-200 text-sm font-medium">Заморозка стрика</p>
            <p className="text-ink-500 text-xs">Защити свой прогресс при пропуске дня</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs flex items-center gap-1"
            onClick={() => {/* TODO: buy freeze with coins */}}
          >
            <Coins size={12} /> 50
          </Button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-coral-400 text-sm font-medium hover:text-coral-300 transition-colors mb-8"
        >
          <LogOut size={16} />
          Выйти из аккаунта
        </button>
      </div>
    </PageShell>
  )
}
