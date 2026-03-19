import type { SimulationNodeDatum } from 'd3-force'
import type { KnowledgeEntry } from '@/lib/api'

export type TopicStatus = 'unknown' | 'learning' | 'mastered'

export interface SectionNode extends SimulationNodeDatum {
  type: 'section'
  id: string
  label: string
  shortLabel: string
  color: string
  expanded: boolean
  radius: number
  total: number
  mastered: number
  learning: number
}

export interface TopicNode extends SimulationNodeDatum {
  type: 'topic'
  id: string
  topicId: number
  label: string
  status: TopicStatus
  score: number
  sectionId: string
  radius: number
}

export type GraphNode = SectionNode | TopicNode

export interface GraphEdge {
  source: string
  target: string
  type: 'section-section' | 'section-topic'
}

export interface ViewTransform {
  tx: number
  ty: number
  scale: number
}

export interface GraphPreset {
  id: string
  label: string
  icon: string
  filterTopics?: (entry: KnowledgeEntry) => boolean
}

export interface TooltipData {
  node: GraphNode
  screenX: number
  screenY: number
}
