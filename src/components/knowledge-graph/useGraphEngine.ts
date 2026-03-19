import { useRef, useEffect, useCallback, useState } from 'react'
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationLinkDatum,
} from 'd3-force'
import type { KnowledgeEntry } from '@/lib/api'
import type { GraphNode, GraphEdge, SectionNode, TopicNode, GraphPreset } from './graph-types'
import { getSectionMeta, PHYSICS, RENDER } from './graph-constants'

interface GraphEngineOptions {
  entries: KnowledgeEntry[]
  preset: GraphPreset
  requestRedraw: () => void
  canvasSize: React.RefObject<{ w: number; h: number }>
  nodesRef: React.MutableRefObject<GraphNode[]>
  edgesRef: React.MutableRefObject<GraphEdge[]>
}

export function useGraphEngine({
  entries,
  preset,
  requestRedraw,
  canvasSize,
  nodesRef,
  edgesRef,
}: GraphEngineOptions) {
  const simRef = useRef<Simulation<GraphNode, SimulationLinkDatum<GraphNode>> | null>(null)
  const [nodeCount, setNodeCount] = useState(0)
  const bySectionRef = useRef<Map<string, KnowledgeEntry[]>>(new Map())

  function startSimulation(nodes: GraphNode[], edges: GraphEdge[]) {
    simRef.current?.stop()

    const { w, h } = canvasSize.current
    const cx = w / 2 || 200
    const cy = h / 2 || 200

    const linkData = edges.map((e) => ({
      source: e.source,
      target: e.target,
    }))

    const sim = forceSimulation<GraphNode>(nodes)
      .alphaDecay(PHYSICS.alphaDecay)
      .force('charge', forceManyBody<GraphNode>().strength((d) =>
        d.type === 'section' ? PHYSICS.sectionCharge : PHYSICS.topicCharge
      ))
      .force('link', forceLink<GraphNode, SimulationLinkDatum<GraphNode>>(linkData)
        .id((d) => d.id)
        .distance((d) => {
          const src = d.source as GraphNode
          const tgt = d.target as GraphNode
          if (src.type === 'section' && tgt.type === 'section') return PHYSICS.sectionLinkDistance
          return PHYSICS.topicLinkDistance
        })
      )
      .force('center', forceCenter(cx, cy).strength(PHYSICS.centerStrength))
      .force('collide', forceCollide<GraphNode>((d) =>
        d.radius + PHYSICS.collisionPadding
      ))
      .on('tick', () => {
        requestRedraw()
      })

    simRef.current = sim
  }

  // Build section nodes from entries
  useEffect(() => {
    simRef.current?.stop()

    const grouped = new Map<string, KnowledgeEntry[]>()
    for (const entry of entries) {
      if (preset.filterTopics && !preset.filterTopics(entry)) continue
      const list = grouped.get(entry.section) || []
      list.push(entry)
      grouped.set(entry.section, list)
    }
    bySectionRef.current = grouped

    const sectionIds = Array.from(grouped.keys())

    if (sectionIds.length === 0) {
      nodesRef.current = []
      edgesRef.current = []
      setNodeCount(0)
      requestRedraw()
      return
    }

    const sectionNodes: SectionNode[] = sectionIds.map((sectionId) => {
      const topics = grouped.get(sectionId) || []
      const meta = getSectionMeta(sectionId)
      return {
        type: 'section' as const,
        id: `section:${sectionId}`,
        label: sectionId,
        shortLabel: meta.short,
        color: meta.color,
        expanded: false,
        radius: RENDER.sectionRadius,
        total: topics.length,
        mastered: topics.filter((t) => t.status === 'mastered').length,
        learning: topics.filter((t) => t.status === 'learning').length,
      }
    })

    const sectionEdges: GraphEdge[] = []
    for (let i = 0; i < sectionNodes.length - 1; i++) {
      sectionEdges.push({
        source: sectionNodes[i].id,
        target: sectionNodes[i + 1].id,
        type: 'section-section',
      })
    }
    if (sectionNodes.length >= 3) {
      sectionEdges.push({
        source: sectionNodes[sectionNodes.length - 1].id,
        target: sectionNodes[0].id,
        type: 'section-section',
      })
    }

    nodesRef.current = sectionNodes
    edgesRef.current = sectionEdges
    setNodeCount(sectionNodes.length)

    startSimulation(sectionNodes, sectionEdges)

    return () => {
      simRef.current?.stop()
    }
  }, [entries, preset])

  const toggleSection = useCallback((sectionId: string) => {
    const nodeId = `section:${sectionId}`
    const nodes = nodesRef.current
    const edges = edgesRef.current

    const sectionNode = nodes.find((n) => n.id === nodeId) as SectionNode | undefined
    if (!sectionNode) return

    if (sectionNode.expanded) {
      // Collapse
      const topicIds = new Set(
        nodes
          .filter((n) => n.type === 'topic' && (n as TopicNode).sectionId === sectionId)
          .map((n) => n.id)
      )

      nodesRef.current = nodes.filter((n) => !topicIds.has(n.id))
      edgesRef.current = edges.filter(
        (e) => !topicIds.has(e.source) && !topicIds.has(e.target)
      )
      sectionNode.expanded = false
    } else {
      // Expand
      const sectionEntries = bySectionRef.current.get(sectionId) || []
      const maxTopics = 30
      const subset = sectionEntries.length > maxTopics ? sectionEntries.slice(0, maxTopics) : sectionEntries
      const sx = sectionNode.x ?? 0
      const sy = sectionNode.y ?? 0

      const topicNodes: TopicNode[] = subset.map((entry, i) => {
        const angle = (2 * Math.PI * i) / subset.length
        const dist = 50 + Math.random() * 20
        return {
          type: 'topic' as const,
          id: `topic:${entry.topicId}`,
          topicId: entry.topicId,
          label: entry.title,
          status: entry.status,
          score: entry.score,
          sectionId,
          radius: entry.status === 'mastered' ? RENDER.topicRadiusMastered
            : entry.status === 'learning' ? RENDER.topicRadiusLearning
            : RENDER.topicRadius,
          x: sx + Math.cos(angle) * dist,
          y: sy + Math.sin(angle) * dist,
        }
      })

      const newEdges: GraphEdge[] = topicNodes.map((tn) => ({
        source: nodeId,
        target: tn.id,
        type: 'section-topic' as const,
      }))

      nodesRef.current = [...nodes, ...topicNodes]
      edgesRef.current = [...edges, ...newEdges]
      sectionNode.expanded = true
    }

    setNodeCount(nodesRef.current.length)
    startSimulation(nodesRef.current, edgesRef.current)
    simRef.current?.alpha(0.3).restart()
  }, [requestRedraw, nodesRef, edgesRef])

  return {
    nodeCount,
    toggleSection,
  }
}
