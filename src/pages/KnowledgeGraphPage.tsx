import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { TopicGraph, GRAPH_PRESETS, type GraphPreset } from '@/components/knowledge-graph'

export function KnowledgeGraphPage() {
  const navigate = useNavigate()
  const [preset, setPreset] = useState<GraphPreset>(GRAPH_PRESETS[0])
  const [fullscreen, setFullscreen] = useState(false)

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['knowledge-map'],
    queryFn: api.getKnowledgeMap,
  })

  const toggleFullscreen = useCallback(() => {
    setFullscreen((f) => !f)
  }, [])

  return (
    <div className={cn(
      'min-h-screen bg-[#080b14]',
      fullscreen && 'fixed inset-0 z-50'
    )}>
      <div className={cn(
        fullscreen ? 'w-full h-full flex flex-col' : 'max-w-[430px] mx-auto'
      )}>
        {/* Header — hidden in fullscreen */}
        {!fullscreen && (
          <div className="flex items-center gap-3 px-4 pt-5 pb-3">
            <button
              onClick={() => navigate('/knowledge-map')}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-ink-800/50 text-ink-400"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-display text-lg font-bold text-ink-50">Граф знаний</h1>
          </div>
        )}

        {/* Preset tabs — hidden in fullscreen */}
        {!fullscreen && (
          <div className="flex items-center gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
            {GRAPH_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0',
                  preset.id === p.id
                    ? 'bg-violet-500/15 border border-violet-400/30 text-violet-300'
                    : 'bg-ink-800/40 border border-ink-700/25 text-ink-400'
                )}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Graph — single instance, CSS-based fullscreen */}
        <div className={cn(
          fullscreen ? 'flex-1 min-h-0' : 'px-4 pb-6'
        )}>
          {isLoading ? (
            <div className="h-[420px] rounded-2xl bg-ink-800/30 animate-pulse" />
          ) : (
            <div
              className={cn(
                fullscreen
                  ? 'w-full h-full'
                  : 'rounded-2xl bg-ink-900/80 border border-ink-700/30 overflow-hidden'
              )}
              style={fullscreen ? undefined : { height: 420 }}
            >
              <TopicGraph
                entries={entries}
                preset={preset}
                fullscreen={fullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
