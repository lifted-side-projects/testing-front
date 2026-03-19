import { getToken, clearAuth } from './auth'

const BASE = import.meta.env.VITE_API_URL || '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearAuth()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || body.message || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name: string; interest?: string }) =>
    request<{ token: string; user: { id: number; email: string; name: string; role: string; interest: string | null } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: { id: number; email: string; name: string; role: string; interest: string | null } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateInterest: (interest: 'anime' | 'videogames') =>
    request<{ user: { id: number; email: string; name: string; role: string; interest: string | null } }>('/auth/interest', {
      method: 'PATCH',
      body: JSON.stringify({ interest }),
    }),

  // Diagnostic
  getQuestions: () =>
    request<{ questions: Question[]; total: number }>('/questions').then((r) => r.questions),

  submitDiagnostic: (answers: { questionId: number; answer: unknown }[]) =>
    request<DiagnosticResult>('/diagnostic/submit', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Knowledge
  getKnowledgeMap: () =>
    request<{ topics: KnowledgeEntry[]; total: number }>('/student/knowledge-map').then((r) => r.topics),

  getKnowledgeStats: () =>
    request<KnowledgeStats>('/student/knowledge-map/stats'),

  getLearningPlan: () =>
    request<{ planId: string; items: LearningPlanItem[]; totalItems: number; completedItems: number }>('/student/learning-plan')
      .then((r) => ({ id: r.planId, items: r.items, progress: r.totalItems > 0 ? r.completedItems / r.totalItems : 0 })),

  getCurrentLesson: () =>
    request<{ topicId: number; title: string } | null>('/student/learning-plan/current-lesson'),

  // Tutor (read-only on student frontend — generation happens via admin)
  getPresentation: (topicId: number) =>
    request<PresentationStatus>(`/student/presentation/${topicId}`),

  getSlideImage: (folderName: string, slideNumber: number) =>
    `${BASE}/slide-image/${folderName}/${slideNumber}`,

  // Quiz (read-only — generation happens via admin)
  getAvailableQuiz: (topicId: number) =>
    request<QuizSession>(`/student/quiz/available/${topicId}`),

  submitQuiz: (sessionId: string, answers: Record<number, unknown>) =>
    request<{ sessionId: string; topicId: number; totalQuestions: number; correctCount: number; score: number; passed: boolean; results: QuizResult['answers'] }>(`/student/quiz/${sessionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId: Number(questionId),
          answer,
        })),
      }),
    }).then((r) => ({
      sessionId: r.sessionId,
      score: r.score,
      passed: r.passed,
      totalQuestions: r.totalQuestions,
      answers: r.results,
    })),

  getQuizResult: (sessionId: string) =>
    request<QuizResult>(`/student/quiz/${sessionId}`),

  getQuizHistory: (topicId: number) =>
    request<QuizHistoryItem[]>(`/student/quiz/history/${topicId}`),

  getWeakTopics: () =>
    request<WeakTopic[]>('/student/weak-topics'),
}

// Types
export interface Question {
  id: number
  text: string
  questionType: 'single_choice' | 'multiple_choice' | 'matching'
  // Backend sends options as [{a: "..."}, {b: "..."}] — array of single-key objects
  options?: Record<string, string>[]
  // For matching questions
  keys?: string[]
  values?: string[]
  difficulty?: number
}

export interface DiagnosticResult {
  sessionId: string
  percentage: number
  topics: { id: number; title: string; known: boolean }[]
  learningPlanId: string
}

export interface KnowledgeEntry {
  topicId: number
  title: string
  grade: number
  section: string
  status: 'unknown' | 'learning' | 'mastered'
  score: number
}

export interface KnowledgeStats {
  total: number
  mastered: number
  learning: number
  unknown: number
  byGrade: Record<string, { total: number; mastered: number; learning: number; unknown: number }>
}

export interface LearningPlan {
  id: string
  items: LearningPlanItem[]
  progress: number
}

export interface LearningPlanItem {
  id: number
  topicId: number
  title: string
  grade: number
  orderIndex: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
}

export interface PresentationStatus {
  jobId: string
  status: 'pending' | 'planning' | 'generating' | 'done' | 'error'
  topicId: number
  style?: 'classic' | 'manga' | 'rpg'
  totalSlides: number
  completedSlides: number
  slides: { slideNumber: number; type: string; title: string; imagePath: string }[]
  folderName?: string
}

export interface QuizSession {
  sessionId: string
  topicId: number
  topicTitle?: string
  completed?: boolean
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: number
  questionType: 'single_choice' | 'multiple_choice' | 'open_answer'
  questionText: string
  options: { label: string; text: string }[] | null
  orderIndex: number
}

export interface QuizResult {
  sessionId: string
  score: number
  passed: boolean
  totalQuestions: number
  answers: {
    questionId: number
    questionText: string
    questionType: string
    options?: { label: string; text: string }[] | null
    studentAnswer: unknown
    correctAnswer: unknown
    isCorrect: boolean
    score: number
    aiComment?: string
    explanation?: string
  }[]
}

export interface QuizHistoryItem {
  sessionId: string
  score: number
  passed: boolean
  startedAt: string
  completedAt: string
}

export interface WeakTopic {
  topicId: number
  title: string
  grade: number
  score: number
  sections: { title: string; relevance: number }[]
}
