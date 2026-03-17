import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, type KnowledgeEntry } from '@/lib/api'
import { PageShell } from '@/components/PageShell'
import { cn } from '@/lib/utils'
import { Search, BookOpen, CheckCircle2, Circle, ChevronRight } from 'lucide-react'

const GRADE_FILTERS = [
  { label: 'Все', value: 0 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 },
  { label: '11', value: 11 },
]

const SECTION_MAP: Record<string, { name: string; icon: string; color: string }> = {
  'Неорганическая химия': { name: 'Неорганика', icon: '⚗️', color: '#52b788' },
  'Органическая химия': { name: 'Органика', icon: '🧬', color: '#9d4edd' },
  'Общая химия': { name: 'Общая', icon: '🔬', color: '#e8b931' },
  'Аналитическая химия': { name: 'Аналитика', icon: '📊', color: '#f4845f' },
}

function getSectionInfo(section: string) {
  for (const [key, val] of Object.entries(SECTION_MAP)) {
    if (section.toLowerCase().includes(key.toLowerCase().split(' ')[0])) return val
  }
  return { name: section, icon: '🧪', color: '#7a8ba6' }
}

export function KnowledgeMapPage() {
  const navigate = useNavigate()
  const [grade, setGrade] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['knowledge-map'],
    queryFn: api.getKnowledgeMap,
  })

  const { data: stats } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: api.getKnowledgeStats,
  })

  // Group by section
  const filtered = entries.filter((e) => {
    if (grade && e.grade !== grade) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    return true
  })

  const grouped = filtered.reduce<Record<string, KnowledgeEntry[]>>((acc, e) => {
    const key = e.section || 'Прочее'
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  const totalMastered = stats?.mastered || 0
  const totalAll = stats?.total || 1
  const masteredPercent = Math.round((totalMastered / totalAll) * 100)

  return (
    <PageShell>
      <div className="px-5 pt-6 page-enter">
        {/* Header */}
        <h1 className="font-display text-2xl font-bold text-ink-50 mb-1">Карта знаний</h1>
        <p className="text-ink-400 text-sm mb-5">
          Изучено {totalMastered} из {totalAll} тем ({masteredPercent}%)
        </p>

        {/* Overall progress */}
        <div className="h-2 bg-ink-800 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full rounded-full progress-fill"
            style={{
              width: `${masteredPercent}%`,
              background: 'linear-gradient(90deg, #52b788, #40916c)',
            }}
          />
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Найти тему..."
            className="w-full bg-ink-800/50 border border-ink-700/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-amber-400/30"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-2 overflow-x-auto no-scrollbar">
          {GRADE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setGrade(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                grade === f.value
                  ? 'bg-amber-400 text-ink-950'
                  : 'bg-ink-800/50 text-ink-400 border border-ink-700/30'
              )}
            >
              {f.value === 0 ? f.label : `${f.label} класс`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-5 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'Все' },
            { key: 'mastered', label: 'Изучено' },
            { key: 'learning', label: 'В процессе' },
            { key: 'unknown', label: 'Неизвестно' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                statusFilter === f.key
                  ? 'bg-ink-700 text-ink-100'
                  : 'text-ink-500'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Map Nodes */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32" />)}
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {Object.entries(grouped).map(([section, topics]) => {
              const info = getSectionInfo(section)
              const masteredInSection = topics.filter((t) => t.status === 'mastered').length
              const sectionProgress = Math.round((masteredInSection / topics.length) * 100)

              return (
                <div key={section}>
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{info.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-ink-200 text-sm font-semibold">{info.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-ink-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${sectionProgress}%`, background: info.color }}
                          />
                        </div>
                        <span className="text-ink-500 text-[10px] font-mono">{sectionProgress}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Topic nodes */}
                  <div className="grid grid-cols-1 gap-1.5">
                    {topics.map((topic) => (
                      <button
                        key={topic.topicId}
                        onClick={() => navigate(`/lesson/${topic.topicId}`)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.98]',
                          topic.status === 'mastered'
                            ? 'bg-sage-500/8 border border-sage-500/15'
                            : topic.status === 'learning'
                            ? 'bg-amber-400/5 border border-amber-400/10'
                            : 'bg-ink-800/20 border border-ink-700/15 opacity-70'
                        )}
                      >
                        {topic.status === 'mastered' ? (
                          <CheckCircle2 size={16} className="text-sage-400 shrink-0" />
                        ) : topic.status === 'learning' ? (
                          <BookOpen size={16} className="text-amber-400 shrink-0" />
                        ) : (
                          <Circle size={16} className="text-ink-600 shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm truncate',
                            topic.status === 'mastered' ? 'text-sage-300' :
                            topic.status === 'learning' ? 'text-ink-200' :
                            'text-ink-400'
                          )}>
                            {topic.title}
                          </p>
                        </div>

                        {topic.score > 0 && (
                          <span className={cn(
                            'text-xs font-mono shrink-0',
                            topic.score >= 0.7 ? 'text-sage-400' : 'text-amber-400'
                          )}>
                            {Math.round(topic.score * 100)}%
                          </span>
                        )}

                        <ChevronRight size={14} className="text-ink-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}

            {Object.keys(grouped).length === 0 && (
              <div className="text-center py-12">
                <p className="text-ink-500">Ничего не найдено</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  )
}
