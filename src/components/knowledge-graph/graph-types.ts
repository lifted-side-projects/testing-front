import type { SimulationNodeDatum } from 'd3-force'
import type { KnowledgeEntry } from '@/lib/api'

export type TopicStatus = 'unknown' | 'learning' | 'mastered'

export interface GradeNode extends SimulationNodeDatum {
  type: 'grade'
  id: string
  grade: number
  expanded: boolean
  radius: number
  total: number
  mastered: number
  learning: number
}

export interface SectionNode extends SimulationNodeDatum {
  type: 'section'
  id: string
  gradeId: number
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

export type GraphNode = GradeNode | SectionNode | TopicNode

export interface GraphEdge {
  source: string
  target: string
  type: 'grade-grade' | 'grade-section' | 'section-section' | 'section-topic'
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
