import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { Trophy, TrendingUp, ArrowRight, Brain, Beaker } from 'lucide-react'
import type { DiagnosticResult } from '@/lib/api'

export function DiagnosticResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()

  // Try router state first (immediate navigation), then fetch from API (page refresh)
  const stateResult = location.state?.result as DiagnosticResult | undefined

  const { data: fetchedResult, isLoading } = useQuery({
    queryKey: ['diagnostic-result', sessionId],
    queryFn: () => api.getDiagnosticResult(sessionId!),
    enabled: !stateResult && !!sessionId,
  })

  const result = stateResult || fetchedResult

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 page-enter">
        <Beaker size={40} className="text-amber-400 animate-pulse" />
        <p className="text-ink-400">Загружаем результаты...</p>
      </div>
    )
  }

  if (!result) {
    return <Navigate to="/" replace />
  }

  const knownCount = result.topics.filter((t) => t.known).length
  const weakCount = result.topics.filter((t) => !t.known).length
  const percentage = Math.round(result.percentage)

  // Group weak topics by section
  const weakBySection = result.topics
    .filter((t) => !t.known)
    .reduce<Record<string, typeof result.topics>>((acc, topic) => {
      const key = `${topic.grade} класс — ${topic.section}`
      if (!acc[key]) acc[key] = []
      acc[key].push(topic)
      return acc
    }, {})

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10 page-enter">
      {/* Top decoration */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-amber-400/8 to-transparent pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Score circle */}
        <div className="relative w-40 h-40 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#232a3f" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={percentage >= 70 ? '#52b788' : percentage >= 40 ? '#e8b931' : '#e76f51'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 327} 327`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-bold text-ink-50">{percentage}%</span>
            <span className="text-ink-400 text-xs mt-1">точность</span>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-ink-50 mb-2">
          {percentage >= 70 ? 'Отличная база!' : percentage >= 40 ? 'Хороший старт!' : 'Не переживай!'}
        </h1>
        <p className="text-ink-400 text-sm mb-8 max-w-[280px]">
          Мы составили персональный план обучения специально для тебя
        </p>

        {/* Stats cards */}
        <div className="flex gap-3 w-full mb-8">
          <div className="flex-1 bg-sage-500/10 border border-sage-500/20 rounded-2xl p-4">
            <Trophy size={20} className="text-sage-400 mb-2" />
            <div className="font-display text-2xl font-bold text-sage-300">{knownCount}</div>
            <div className="text-ink-400 text-xs">Изучено</div>
          </div>
          <div className="flex-1 bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4">
            <TrendingUp size={20} className="text-amber-400 mb-2" />
            <div className="font-display text-2xl font-bold text-amber-300">{weakCount}</div>
            <div className="text-ink-400 text-xs">К изучению</div>
          </div>
          <div className="flex-1 bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4">
            <Brain size={20} className="text-violet-400 mb-2" />
            <div className="font-display text-2xl font-bold text-violet-300">{result.topics.length}</div>
            <div className="text-ink-400 text-xs">Всего тем</div>
          </div>
        </div>

        {/* Weak topics grouped by section */}
        <div className="w-full text-left mb-6">
          <h3 className="text-ink-400 text-xs font-medium uppercase tracking-wider mb-3">Приоритетные темы</h3>
          <div className="space-y-4">
            {Object.entries(weakBySection).slice(0, 4).map(([section, topics]) => (
              <div key={section}>
                <p className="text-ink-500 text-xs font-medium mb-2">{section}</p>
                <div className="space-y-2">
                  {topics.slice(0, 3).map((topic) => (
                    <div key={topic.id} className="flex items-center gap-3 bg-ink-800/40 rounded-xl px-4 py-3 border border-ink-700/30">
                      <div className="w-2 h-2 rounded-full bg-coral-400" />
                      <span className="text-ink-200 text-sm truncate">{topic.title}</span>
                    </div>
                  ))}
                  {topics.length > 3 && (
                    <p className="text-ink-500 text-xs pl-6">и ещё {topics.length - 3}...</p>
                  )}
                </div>
              </div>
            ))}
            {Object.keys(weakBySection).length > 4 && (
              <p className="text-ink-500 text-xs">и ещё {Object.keys(weakBySection).length - 4} разделов...</p>
            )}
          </div>
        </div>
      </div>

      <Button size="lg" onClick={() => navigate('/')} className="flex items-center justify-center gap-2">
        Начать обучение
        <ArrowRight size={18} />
      </Button>
    </div>
  )
}
