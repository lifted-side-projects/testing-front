import { useEffect, useRef } from 'react'
import type { ViewTransform, GraphNode } from './graph-types'
import { screenToWorld, zoomAt, hitTest, distance } from './graph-math'
import { RENDER } from './graph-constants'

type PointerState = 'idle' | 'pending-tap' | 'panning' | 'pinching'

interface PointerEventsOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  transformRef: React.RefObject<ViewTransform>
  nodesRef: React.RefObject<GraphNode[]>
  requestRedraw: () => void
  onTap: (node: GraphNode | null, screenX: number, screenY: number) => void
  onDoubleTap: () => void
}

export function usePointerEvents({
  canvasRef,
  transformRef,
  nodesRef,
  requestRedraw,
  onTap,
  onDoubleTap,
}: PointerEventsOptions) {
  const stateRef = useRef<PointerState>('idle')
  const startRef = useRef({ x: 0, y: 0 })
  const lastRef = useRef({ x: 0, y: 0 })
  const lastTapTimeRef = useRef(0)
  // Pinch state
  const pinchDistRef = useRef(0)
  const pinchMidRef = useRef({ x: 0, y: 0 })
  const pinchIdsRef = useRef<number[]>([])
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function getCanvasXY(e: PointerEvent | Touch) {
      const rect = canvas!.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function onPointerDown(e: PointerEvent) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      canvas!.setPointerCapture(e.pointerId)

      const pointers = activePointersRef.current

      if (pointers.size === 1) {
        const pos = getCanvasXY(e)
        stateRef.current = 'pending-tap'
        startRef.current = { x: pos.x, y: pos.y }
        lastRef.current = { x: pos.x, y: pos.y }
      } else if (pointers.size === 2) {
        stateRef.current = 'pinching'
        const pts = Array.from(pointers.values())
        const rect = canvas!.getBoundingClientRect()
        const p1 = { x: pts[0].x - rect.left, y: pts[0].y - rect.top }
        const p2 = { x: pts[1].x - rect.left, y: pts[1].y - rect.top }
        pinchDistRef.current = distance(p1.x, p1.y, p2.x, p2.y)
        pinchMidRef.current = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
        pinchIdsRef.current = Array.from(pointers.keys())
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!activePointersRef.current.has(e.pointerId)) return
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      const state = stateRef.current
      const t = transformRef.current
      const pos = getCanvasXY(e)

      if (state === 'pending-tap') {
        const d = distance(pos.x, pos.y, startRef.current.x, startRef.current.y)
        if (d > RENDER.tapThreshold) {
          stateRef.current = 'panning'
        } else {
          return
        }
      }

      if (stateRef.current === 'panning') {
        const dx = pos.x - lastRef.current.x
        const dy = pos.y - lastRef.current.y
        t.tx += dx
        t.ty += dy
        lastRef.current = { x: pos.x, y: pos.y }
        requestRedraw()
      }

      if (stateRef.current === 'pinching' && activePointersRef.current.size === 2) {
        const pts = Array.from(activePointersRef.current.values())
        const rect = canvas!.getBoundingClientRect()
        const p1 = { x: pts[0].x - rect.left, y: pts[0].y - rect.top }
        const p2 = { x: pts[1].x - rect.left, y: pts[1].y - rect.top }
        const newDist = distance(p1.x, p1.y, p2.x, p2.y)
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2

        if (pinchDistRef.current > 0) {
          const factor = newDist / pinchDistRef.current
          zoomAt(t, factor, midX, midY)

          // Also pan to follow midpoint
          const dx = midX - pinchMidRef.current.x
          const dy = midY - pinchMidRef.current.y
          t.tx += dx
          t.ty += dy
        }

        pinchDistRef.current = newDist
        pinchMidRef.current = { x: midX, y: midY }
        requestRedraw()
      }
    }

    function onPointerUp(e: PointerEvent) {
      const state = stateRef.current

      if (state === 'pending-tap' && activePointersRef.current.size === 1) {
        // It was a tap!
        const pos = getCanvasXY(e)
        const t = transformRef.current
        const world = screenToWorld(pos.x, pos.y, t)
        const hit = hitTest(nodesRef.current, world.x, world.y)

        // Double tap detection
        const now = Date.now()
        if (now - lastTapTimeRef.current < RENDER.doubleTapMs) {
          lastTapTimeRef.current = 0
          onDoubleTap()
        } else {
          lastTapTimeRef.current = now
          onTap(hit, pos.x, pos.y)
        }
      }

      activePointersRef.current.delete(e.pointerId)
      canvas!.releasePointerCapture(e.pointerId)

      if (activePointersRef.current.size === 0) {
        stateRef.current = 'idle'
      } else if (activePointersRef.current.size === 1) {
        // Transition from pinch to pan
        stateRef.current = 'panning'
        const remaining = Array.from(activePointersRef.current.values())[0]
        const rect = canvas!.getBoundingClientRect()
        lastRef.current = { x: remaining.x - rect.left, y: remaining.y - rect.top }
      }
    }

    function onPointerCancel(e: PointerEvent) {
      activePointersRef.current.delete(e.pointerId)
      if (activePointersRef.current.size === 0) {
        stateRef.current = 'idle'
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const rect = canvas!.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
      zoomAt(transformRef.current, factor, sx, sy)
      requestRedraw()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerCancel)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [canvasRef, transformRef, nodesRef, requestRedraw, onTap, onDoubleTap])
}
