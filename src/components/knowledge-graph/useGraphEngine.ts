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
import type { GraphNode, GraphEdge, GradeNode, SectionNode, TopicNode, GraphPreset } from './graph-types'
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
  // grade → section → entries
  const byGradeRef = useRef<Map<number, Map<string, KnowledgeEntry[]>>>(new Map())

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
        d.type === 'grade' ? PHYSICS.gradeCharge
          : d.type === 'section' ? PHYSICS.sectionCharge
          : PHYSICS.topicCharge
      ))
      .force('link', forceLink<GraphNode, SimulationLinkDatum<GraphNode>>(linkData)
        .id((d) => d.id)
        .distance((d) => {
          const src = d.source as GraphNode
          const tgt = d.target as GraphNode
          if (src.type === 'grade' && tgt.type === 'grade') return PHYSICS.gradeLinkDistance
          if (src.type === 'grade' || tgt.type === 'grade') return PHYSICS.gradeSectionLinkDistance
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

  // Build grade nodes from entries
  useEffect(() => {
    simRef.current?.stop()

    // Group: grade → section → entries
    const byGrade = new Map<number, Map<string, KnowledgeEntry[]>>()
    for (const entry of entries) {
      if (preset.filterTopics && !preset.filterTopics(entry)) continue
      let sectionMap = byGrade.get(entry.grade)
      if (!sectionMap) {
        sectionMap = new Map()
        byGrade.set(entry.grade, sectionMap)
      }
      const list = sectionMap.get(entry.section) || []
      list.push(entry)
      sectionMap.set(entry.section, list)
    }
    byGradeRef.current = byGrade

    const grades = Array.from(byGrade.keys()).sort((a, b) => a - b)

    if (grades.length === 0) {
      nodesRef.current = []
      edgesRef.current = []
      setNodeCount(0)
      requestRedraw()
      return
    }

    const gradeNodes: GradeNode[] = grades.map((grade) => {
      const sectionMap = byGrade.get(grade)!
      let total = 0, mastered = 0, learning = 0
      for (const topics of sectionMap.values()) {
        total += topics.length
        mastered += topics.filter((t) => t.status === 'mastered').length
        learning += topics.filter((t) => t.status === 'learning').length
      }
      return {
        type: 'grade' as const,
        id: `grade:${grade}`,
        grade,
        expanded: false,
        radius: RENDER.gradeRadius,
        total,
        mastered,
        learning,
      }
    })

    // Chain grade nodes
    const gradeEdges: GraphEdge[] = []
    for (let i = 0; i < gradeNodes.length - 1; i++) {
      gradeEdges.push({
        source: gradeNodes[i].id,
        target: gradeNodes[i + 1].id,
        type: 'grade-grade',
      })
    }
    if (gradeNodes.length >= 3) {
      gradeEdges.push({
        source: gradeNodes[gradeNodes.length - 1].id,
        target: gradeNodes[0].id,
        type: 'grade-grade',
      })
    }

    nodesRef.current = gradeNodes
    edgesRef.current = gradeEdges
    setNodeCount(gradeNodes.length)

    startSimulation(gradeNodes, gradeEdges)

    return () => {
      simRef.current?.stop()
    }
  }, [entries, preset])

  const toggleGrade = useCallback((grade: number) => {
    const gradeNodeId = `grade:${grade}`
    const nodes = nodesRef.current
    const edges = edgesRef.current

    const gradeNode = nodes.find((n) => n.id === gradeNodeId) as GradeNode | undefined
    if (!gradeNode) return

    if (gradeNode.expanded) {
      // Collapse: remove all sections (and their expanded topics) for this grade
      const sectionIds = new Set(
        nodes
          .filter((n) => n.type === 'section' && (n as SectionNode).gradeId === grade)
          .map((n) => n.id)
      )
      // Also find topics belonging to those sections
      const topicIds = new Set(
        nodes
          .filter((n) => n.type === 'topic' && sectionIds.has(`section:${(n as TopicNode).sectionId}`))
          .map((n) => n.id)
      )
      const removeIds = new Set([...sectionIds, ...topicIds])

      nodesRef.current = nodes.filter((n) => !removeIds.has(n.id))
      edgesRef.current = edges.filter(
        (e) => !removeIds.has(e.source) && !removeIds.has(e.target)
      )
      gradeNode.expanded = false
    } else {
      // Expand: create section nodes for this grade
      const sectionMap = byGradeRef.current.get(grade)
      if (!sectionMap) return

      const gx = gradeNode.x ?? 0
      const gy = gradeNode.y ?? 0
      const sectionIds = Array.from(sectionMap.keys())

      const sectionNodes: SectionNode[] = sectionIds.map((sectionId, i) => {
        const topics = sectionMap.get(sectionId) || []
        const meta = getSectionMeta(sectionId)
        const angle = (2 * Math.PI * i) / sectionIds.length
        const dist = 80 + Math.random() * 30
        return {
          type: 'section' as const,
          id: `section:${sectionId}`,
          gradeId: grade,
          label: sectionId,
          shortLabel: meta.short,
          color: meta.color,
          expanded: false,
          radius: RENDER.sectionRadius,
          total: topics.length,
          mastered: topics.filter((t) => t.status === 'mastered').length,
          learning: topics.filter((t) => t.status === 'learning').length,
          x: gx + Math.cos(angle) * dist,
          y: gy + Math.sin(angle) * dist,
        }
      })

      const newEdges: GraphEdge[] = sectionNodes.map((sn) => ({
        source: gradeNodeId,
        target: sn.id,
        type: 'grade-section' as const,
      }))

      // Chain sections together
      for (let i = 0; i < sectionNodes.length - 1; i++) {
        newEdges.push({
          source: sectionNodes[i].id,
          target: sectionNodes[i + 1].id,
          type: 'section-section',
        })
      }

      nodesRef.current = [...nodes, ...sectionNodes]
      edgesRef.current = [...edges, ...newEdges]
      gradeNode.expanded = true
    }

    setNodeCount(nodesRef.current.length)
    startSimulation(nodesRef.current, edgesRef.current)
    simRef.current?.alpha(0.3).restart()
  }, [requestRedraw, nodesRef, edgesRef])

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
      // Expand — find entries for this section within the grade
      const sectionMap = byGradeRef.current.get(sectionNode.gradeId)
      const sectionEntries = sectionMap?.get(sectionId) || []
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
    toggleGrade,
    toggleSection,
  }
}
