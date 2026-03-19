import { useRef, useState, useCallback, useEffect } from 'react'
import type { KnowledgeEntry } from '@/lib/api'
import type { GraphNode, GraphPreset, TooltipData, ViewTransform, GraphEdge, SectionNode } from './graph-types'
import { STATUS_COLORS, STATUS_TEXT } from './graph-constants'
import { useCanvasRenderer } from './useCanvasRenderer'
import { usePointerEvents } from './usePointerEvents'
import { useGraphEngine } from './useGraphEngine'
import { useFullscreen } from './useFullscreen'

interface TopicGraphProps {
  entries: KnowledgeEntry[]
  preset: GraphPreset
  fullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function TopicGraph({ entries, preset, fullscreen, onToggleFullscreen }: TopicGraphProps) {
  const transformRef = useRef<ViewTransform>({ tx: 0, ty: 0, scale: 1 })
  const selectedIdRef = useRef<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Shared refs that both renderer and engine write/read
  const sharedNodesRef = useRef<GraphNode[]>([])
  const sharedEdgesRef = useRef<GraphEdge[]>([])

  const { canvasRef, requestRedraw, canvasSize } = useCanvasRenderer({
    transformRef,
    nodesRef: sharedNodesRef,
    edgesRef: sharedEdgesRef,
    selectedIdRef,
  })

  const { nodeCount, toggleSection } = useGraphEngine({
    entries,
    preset,
    requestRedraw,
    canvasSize,
    nodesRef: sharedNodesRef,
    edgesRef: sharedEdgesRef,
  })

  const onTap = useCallback((node: GraphNode | null, _screenX: number, _screenY: number) => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current)
      tooltipTimerRef.current = null
    }

    if (!node) {
      selectedIdRef.current = null
      setTooltip(null)
      requestRedraw()
      return
    }

    selectedIdRef.current = node.id
    requestRedraw()

    if (node.type === 'section') {
      toggleSection((node as SectionNode).label)
      setTooltip(null)
    } else {
      setTooltip({ node, screenX: _screenX, screenY: _screenY })
      tooltipTimerRef.current = setTimeout(() => {
        selectedIdRef.current = null
        setTooltip(null)
        requestRedraw()
      }, 3000)
    }
  }, [toggleSection, requestRedraw])

  const onDoubleTap = useCallback(() => {
    transformRef.current = { tx: 0, ty: 0, scale: 1 }
    requestRedraw()
  }, [requestRedraw])

  usePointerEvents({
    canvasRef,
    transformRef,
    nodesRef: sharedNodesRef,
    requestRedraw,
    onTap,
    onDoubleTap,
  })

  useFullscreen(!!fullscreen, () => onToggleFullscreen?.())

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    }
  }, [])

  const resetZoom = useCallback(() => {
    transformRef.current = { tx: 0, ty: 0, scale: 1 }
    requestRedraw()
  }, [requestRedraw])

  return (
    <div className="relative flex flex-col w-full h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <span>{preset.icon}</span>
          <span className="text-ink-200 text-sm font-medium">{preset.label}</span>
          <span className="text-ink-500 text-[11px]">({nodeCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetZoom}
            className="text-ink-500 text-[10px] px-2 py-1 rounded-lg bg-ink-800/60 hover:text-ink-300 transition-colors"
          >
            Сброс
          </button>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="text-ink-500 text-xs px-2 py-1 rounded-lg bg-ink-800/60 hover:text-ink-300 transition-colors"
            >
              {fullscreen ? '\u2715 Закрыть' : '\u26F6'}
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative min-h-0">
        {nodeCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-ink-500 text-sm">Нет тем для отображения</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ touchAction: 'none', cursor: 'grab' }}
        />

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 bg-ink-800/95 border border-ink-600/40 rounded-xl px-3.5 py-2.5 shadow-lg backdrop-blur-sm max-w-[280px] pointer-events-none">
            <p className="text-ink-100 text-xs font-medium leading-snug">
              {tooltip.node.label}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: STATUS_COLORS[tooltip.node.type === 'topic' ? tooltip.node.status : 'mastered'].fill }}
              />
              <span className="text-ink-400 text-[10px]">
                {tooltip.node.type === 'topic'
                  ? STATUS_TEXT[tooltip.node.status]
                  : `${(tooltip.node as SectionNode).mastered}/${(tooltip.node as SectionNode).total} изучено`}
              </span>
              {tooltip.node.type === 'topic' && tooltip.node.score > 0 && (
                <span className="text-amber-400 text-[10px] font-mono ml-auto">
                  {Math.round(tooltip.node.score * 100)}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 shrink-0 border-t border-ink-700/15">
        {(['mastered', 'learning', 'unknown'] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: STATUS_COLORS[s].fill, border: `1px solid ${STATUS_COLORS[s].stroke}` }}
            />
            <span className="text-ink-500 text-[10px]">{STATUS_TEXT[s]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
