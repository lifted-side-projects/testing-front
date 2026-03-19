import type { GraphNode, GraphEdge, GradeNode, SectionNode, TopicNode } from './graph-types'
import { STATUS_COLORS } from './graph-constants'

export function drawEdges(
  ctx: CanvasRenderingContext2D,
  edges: GraphEdge[],
  nodeMap: Map<string, GraphNode>,
  selectedId: string | null,
  scale: number,
) {
  for (const edge of edges) {
    const a = nodeMap.get(edge.source)
    const b = nodeMap.get(edge.target)
    if (!a || !b) continue

    const ax = a.x ?? 0, ay = a.y ?? 0
    const bx = b.x ?? 0, by = b.y ?? 0
    const hl = selectedId !== null && (a.id === selectedId || b.id === selectedId)

    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)

    if (edge.type === 'grade-grade') {
      ctx.strokeStyle = hl ? 'rgba(232,185,49,0.5)' : 'rgba(61,71,96,0.4)'
      ctx.lineWidth = (hl ? 2.5 : 1.5) / scale
    } else if (edge.type === 'grade-section') {
      ctx.strokeStyle = hl ? 'rgba(232,185,49,0.45)' : 'rgba(61,71,96,0.3)'
      ctx.lineWidth = (hl ? 2 : 1) / scale
    } else if (edge.type === 'section-section') {
      ctx.strokeStyle = hl ? 'rgba(232,185,49,0.5)' : 'rgba(61,71,96,0.35)'
      ctx.lineWidth = (hl ? 2 : 1.2) / scale
    } else {
      ctx.strokeStyle = hl ? 'rgba(232,185,49,0.4)' : 'rgba(61,71,96,0.18)'
      ctx.lineWidth = (hl ? 1.5 : 0.8) / scale
    }
    ctx.stroke()
  }
}

export function drawSectionNode(
  ctx: CanvasRenderingContext2D,
  node: SectionNode,
  selected: boolean,
  scale: number,
) {
  const x = node.x ?? 0
  const y = node.y ?? 0
  const r = node.radius

  // Glow
  ctx.beginPath()
  ctx.arc(x, y, r + (selected ? 6 : 4), 0, Math.PI * 2)
  ctx.fillStyle = selected
    ? 'rgba(232,185,49,0.12)'
    : `${node.color}22`
  ctx.fill()

  // Main circle
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#131825'
  ctx.fill()
  ctx.strokeStyle = selected ? '#e8b931' : node.color
  ctx.lineWidth = (selected ? 2.5 : 1.5) / scale
  ctx.stroke()

  // Progress arc (mastered / total)
  if (node.total > 0) {
    const progress = node.mastered / node.total
    if (progress > 0) {
      ctx.beginPath()
      ctx.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
      ctx.strokeStyle = '#52b788'
      ctx.lineWidth = 3 / scale
      ctx.stroke()
    }
    // Learning arc continues after mastered
    const learningProgress = (node.mastered + node.learning) / node.total
    if (node.learning > 0) {
      ctx.beginPath()
      ctx.arc(x, y, r - 3, -Math.PI / 2 + Math.PI * 2 * (node.mastered / node.total), -Math.PI / 2 + Math.PI * 2 * learningProgress)
      ctx.strokeStyle = '#e8b931'
      ctx.lineWidth = 3 / scale
      ctx.stroke()
    }
  }

  // Section letter (first char of short label — more reliable than emoji on canvas)
  const letter = node.shortLabel.charAt(0).toUpperCase() || '?'
  const letterSize = 16 / scale
  ctx.font = `700 ${letterSize}px "DM Sans", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = node.color
  ctx.fillText(letter, x, y)

  // Count badge
  if (scale > 0.4) {
    const badgeText = `${node.mastered}/${node.total}`
    const fs = 8 / scale
    ctx.font = `600 ${fs}px "DM Sans", sans-serif`
    const tw = ctx.measureText(badgeText).width
    const bx = x + r * 0.7
    const by = y - r * 0.7
    const pad = 3 / scale

    ctx.beginPath()
    ctx.roundRect(bx - tw / 2 - pad, by - fs / 2 - pad, tw + pad * 2, fs + pad * 2, 4 / scale)
    ctx.fillStyle = '#1a1f2e'
    ctx.fill()
    ctx.strokeStyle = node.color + '55'
    ctx.lineWidth = 0.5 / scale
    ctx.stroke()

    ctx.fillStyle = '#c8d0de'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, bx, by)
  }
}

export function drawGradeNode(
  ctx: CanvasRenderingContext2D,
  node: GradeNode,
  selected: boolean,
  scale: number,
) {
  const x = node.x ?? 0
  const y = node.y ?? 0
  const r = node.radius

  // Glow
  ctx.beginPath()
  ctx.arc(x, y, r + (selected ? 7 : 5), 0, Math.PI * 2)
  ctx.fillStyle = selected
    ? 'rgba(232,185,49,0.14)'
    : 'rgba(122,139,166,0.1)'
  ctx.fill()

  // Main circle
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#131825'
  ctx.fill()
  ctx.strokeStyle = selected ? '#e8b931' : '#7a8ba6'
  ctx.lineWidth = (selected ? 3 : 2) / scale
  ctx.stroke()

  // Progress arcs
  if (node.total > 0) {
    const masteredRatio = node.mastered / node.total
    if (masteredRatio > 0) {
      ctx.beginPath()
      ctx.arc(x, y, r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * masteredRatio)
      ctx.strokeStyle = '#52b788'
      ctx.lineWidth = 3.5 / scale
      ctx.stroke()
    }
    const learningEnd = (node.mastered + node.learning) / node.total
    if (node.learning > 0) {
      ctx.beginPath()
      ctx.arc(x, y, r - 4, -Math.PI / 2 + Math.PI * 2 * masteredRatio, -Math.PI / 2 + Math.PI * 2 * learningEnd)
      ctx.strokeStyle = '#e8b931'
      ctx.lineWidth = 3.5 / scale
      ctx.stroke()
    }
  }

  // Grade number
  const numSize = 22 / scale
  ctx.font = `700 ${numSize}px "DM Sans", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#e2e8f0'
  ctx.fillText(String(node.grade), x, y)

  // Count badge
  if (scale > 0.35) {
    const badgeText = `${node.mastered}/${node.total}`
    const fs = 8 / scale
    ctx.font = `600 ${fs}px "DM Sans", sans-serif`
    const tw = ctx.measureText(badgeText).width
    const bx = x + r * 0.7
    const by = y - r * 0.7
    const pad = 3 / scale

    ctx.beginPath()
    ctx.roundRect(bx - tw / 2 - pad, by - fs / 2 - pad, tw + pad * 2, fs + pad * 2, 4 / scale)
    ctx.fillStyle = '#1a1f2e'
    ctx.fill()
    ctx.strokeStyle = '#7a8ba655'
    ctx.lineWidth = 0.5 / scale
    ctx.stroke()

    ctx.fillStyle = '#c8d0de'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, bx, by)
  }
}

export function drawTopicNode(
  ctx: CanvasRenderingContext2D,
  node: TopicNode,
  selected: boolean,
  scale: number,
) {
  const x = node.x ?? 0
  const y = node.y ?? 0
  const r = node.radius
  const c = STATUS_COLORS[node.status]

  // Glow
  if (node.status !== 'unknown' || selected) {
    ctx.beginPath()
    ctx.arc(x, y, r + (selected ? 5 : 3), 0, Math.PI * 2)
    ctx.fillStyle = selected ? 'rgba(232,185,49,0.15)' : c.glow
    ctx.fill()
  }

  // Circle
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = c.fill
  ctx.fill()
  ctx.strokeStyle = selected ? '#e8b931' : c.stroke
  ctx.lineWidth = (selected ? 2 : 1) / scale
  ctx.stroke()

  // Score arc
  if (node.score > 0) {
    ctx.beginPath()
    ctx.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * node.score)
    ctx.strokeStyle = node.score >= 0.7 ? '#95d5b2' : '#f0c040'
    ctx.lineWidth = 2 / scale
    ctx.stroke()
  }
}

export function drawLabels(
  ctx: CanvasRenderingContext2D,
  nodes: GraphNode[],
  selectedId: string | null,
  scale: number,
) {
  if (scale < 0.5) return

  for (const node of nodes) {
    const x = node.x ?? 0
    const y = node.y ?? 0
    const sel = node.id === selectedId

    if (node.type === 'grade') {
      const fs = (sel ? 12 : 11) / scale
      ctx.font = `600 ${fs}px "DM Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = sel ? '#f5f5f5' : '#a0aec0'
      ctx.fillText(`${node.grade} класс`, x, y + node.radius + 6)
    } else if (node.type === 'section') {
      const fs = (sel ? 11 : 10) / scale
      ctx.font = `600 ${fs}px "DM Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = sel ? '#f5f5f5' : '#a0aec0'
      ctx.fillText(node.shortLabel, x, y + node.radius + 5)
    } else {
      const fs = (sel ? 10 : 9) / scale
      ctx.font = `500 ${fs}px "DM Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = sel ? '#f5f5f5' : node.status === 'unknown' ? '#5a6880' : '#c8d0de'
      const maxW = 75 / scale
      let label = node.label
      if (ctx.measureText(label).width > maxW) {
        while (label.length > 3 && ctx.measureText(label + '\u2026').width > maxW) label = label.slice(0, -1)
        label += '\u2026'
      }
      ctx.fillText(label, x, y + node.radius + 4)
    }
  }
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  nodes: GraphNode[],
  edges: GraphEdge[],
  selectedId: string | null,
  scale: number,
) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  drawEdges(ctx, edges, nodeMap, selectedId, scale)

  // Draw grade nodes first, then sections, then topics on top
  for (const node of nodes) {
    if (node.type === 'grade') {
      drawGradeNode(ctx, node as GradeNode, node.id === selectedId, scale)
    }
  }
  for (const node of nodes) {
    if (node.type === 'section') {
      drawSectionNode(ctx, node as SectionNode, node.id === selectedId, scale)
    }
  }
  for (const node of nodes) {
    if (node.type === 'topic') {
      drawTopicNode(ctx, node as TopicNode, node.id === selectedId, scale)
    }
  }

  drawLabels(ctx, nodes, selectedId, scale)
}
