import type { GraphNode, ViewTransform } from './graph-types'
import { RENDER } from './graph-constants'

export function screenToWorld(sx: number, sy: number, t: ViewTransform) {
  return {
    x: (sx - t.tx) / t.scale,
    y: (sy - t.ty) / t.scale,
  }
}

export function worldToScreen(wx: number, wy: number, t: ViewTransform) {
  return {
    x: wx * t.scale + t.tx,
    y: wy * t.scale + t.ty,
  }
}

export function zoomAt(t: ViewTransform, factor: number, screenX: number, screenY: number) {
  const newScale = clamp(t.scale * factor, RENDER.zoomMin, RENDER.zoomMax)
  const ratio = newScale / t.scale
  t.tx = screenX - (screenX - t.tx) * ratio
  t.ty = screenY - (screenY - t.ty) * ratio
  t.scale = newScale
}

export function hitTest(nodes: GraphNode[], worldX: number, worldY: number): GraphNode | null {
  // Check topic nodes first (smaller, on top visually)
  let closest: GraphNode | null = null
  let closestDist = Infinity

  for (const node of nodes) {
    const nx = node.x ?? 0
    const ny = node.y ?? 0
    const dx = nx - worldX
    const dy = ny - worldY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const hitRadius = node.radius + 8

    if (dist < hitRadius && dist < closestDist) {
      // Prioritize topic nodes over section nodes
      if (closest && closest.type === 'topic' && node.type === 'section') continue
      closest = node
      closestDist = dist
    }
  }

  return closest
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function distance(x1: number, y1: number, x2: number, y2: number) {
  const dx = x1 - x2
  const dy = y1 - y2
  return Math.sqrt(dx * dx + dy * dy)
}
