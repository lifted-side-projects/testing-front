import { useRef, useEffect, useCallback } from 'react'
import type { ViewTransform, GraphNode, GraphEdge } from './graph-types'
import { drawScene } from './graph-draw'

interface CanvasRendererOptions {
  transformRef: React.RefObject<ViewTransform>
  nodesRef: React.RefObject<GraphNode[]>
  edgesRef: React.RefObject<GraphEdge[]>
  selectedIdRef: React.RefObject<string | null>
}

export function useCanvasRenderer({
  transformRef,
  nodesRef,
  edgesRef,
  selectedIdRef,
}: CanvasRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dirtyRef = useRef(true)
  const rafRef = useRef(0)
  const sizeRef = useRef({ w: 0, h: 0 })
  const dprRef = useRef(Math.min(window.devicePixelRatio || 1, 2))

  const requestRedraw = useCallback(() => {
    dirtyRef.current = true
  }, [])

  // rAF loop
  useEffect(() => {
    let running = true

    function loop() {
      if (!running) return

      if (dirtyRef.current) {
        dirtyRef.current = false
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const t = transformRef.current
            const dpr = dprRef.current

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.save()
            ctx.scale(dpr, dpr)
            ctx.translate(t.tx, t.ty)
            ctx.scale(t.scale, t.scale)

            drawScene(
              ctx,
              nodesRef.current,
              edgesRef.current,
              selectedIdRef.current,
              t.scale,
            )

            ctx.restore()
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [transformRef, nodesRef, edgesRef, selectedIdRef])

  // ResizeObserver — only resize canvas when dimensions actually change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) return

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const w = Math.floor(entry.contentRect.width)
      const h = Math.floor(entry.contentRect.height)

      if (w === sizeRef.current.w && h === sizeRef.current.h) return
      sizeRef.current = { w, h }

      const dpr = dprRef.current
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      dirtyRef.current = true
    })

    ro.observe(parent)
    return () => ro.disconnect()
  }, [])

  // DPR change listener
  useEffect(() => {
    function updateDpr() {
      const newDpr = Math.min(window.devicePixelRatio || 1, 2)
      if (newDpr !== dprRef.current) {
        dprRef.current = newDpr
        const { w, h } = sizeRef.current
        const canvas = canvasRef.current
        if (canvas && w > 0) {
          canvas.width = w * newDpr
          canvas.height = h * newDpr
        }
        dirtyRef.current = true
      }
    }

    const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    mql.addEventListener('change', updateDpr)
    return () => mql.removeEventListener('change', updateDpr)
  }, [])

  // Redraw when custom fonts load
  useEffect(() => {
    document.fonts.ready.then(() => {
      dirtyRef.current = true
    })
  }, [])

  return { canvasRef, requestRedraw, canvasSize: sizeRef }
}
