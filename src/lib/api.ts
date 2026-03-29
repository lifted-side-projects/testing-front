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
    request<PresentationResponse>(`/student/presentation/${topicId}`),

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

  // Missions & Gamification
  getDailyMissions: () =>
    request<Mission[]>('/student/missions'),

  completeMission: (id: number) =>
    request<{ reward: number }>(`/student/missions/${id}/complete`, { method: 'POST' }),

  getGamification: () =>
    request<Gamification>('/student/gamification'),

  checkin: () =>
    request<Gamification>('/student/gamification/checkin', { method: 'POST' }),

  // Flashcards
  getFlashcardDeck: (topicId: number) =>
    request<FlashcardDeck>(`/student/flashcards/${topicId}`),

  getFlashcardsForReview: (topicId: number) =>
    request<{ cards: Flashcard[] }>(`/student/flashcards/${topicId}/review`).then(r => r.cards),

  recordFlashcardReview: (flashcardId: number, quality: number) =>
    request<{ nextReviewAt: string; intervalDays: number }>('/student/flashcards/review', {
      method: 'POST',
      body: JSON.stringify({ flashcardId, quality }),
    }),

  getFlashcardStats: (topicId: number) =>
    request<FlashcardStats>(`/student/flashcards/${topicId}/stats`),

  // Spaced Repetition
  getReviewsDue: () =>
    request<ReviewDueTopic[]>('/student/reviews/due'),

  getReviewSchedule: () =>
    request<ReviewDueTopic[]>('/student/reviews/schedule'),

  // Quiz error chat
  quizErrorChatStream: async (
    sessionId: string,
    message: string,
    questionId?: number,
  ): Promise<ReadableStream<Uint8Array>> => {
    const token = getToken()
    const res = await fetch(`${BASE}/student/quiz/${sessionId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, questionId }),
    })
    if (res.status === 401) {
      clearAuth()
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.body!
  },

  quizErrorChatSuggestions: (sessionId: string, messages: { role: string; content: string }[], questionId?: number) =>
    request<{ suggestions: string[] }>(`/student/quiz/${sessionId}/chat/suggestions`, {
      method: 'POST',
      body: JSON.stringify({ messages, questionId }),
    }).then(r => r.suggestions).catch(() => []),

  chatSuggestions: (topicId: number, messages: { role: string; content: string }[], slideContext?: SlideContext) =>
    request<{ suggestions: string[] }>(`/student/chat/${topicId}/suggestions`, {
      method: 'POST',
      body: JSON.stringify({ messages, slideContext }),
    }).then(r => r.suggestions).catch(() => []),

  diagnosticChatSuggestions: (sessionId: string, questionId: number, studentAnswer: unknown, messages: { role: string; content: string }[]) =>
    request<{ suggestions: string[] }>('/diagnostic/chat/suggestions', {
      method: 'POST',
      body: JSON.stringify({ sessionId, questionId, studentAnswer, messages }),
    }).then(r => r.suggestions).catch(() => []),

  // Interactive Diagnostic
  startDiagnostic: () =>
    request<DiagnosticSession>('/diagnostic/start', { method: 'POST' }),

  recordDiagnosticAnswer: (data: { sessionId: string; questionId: number; answer: unknown; isCorrect: boolean; score: number }) =>
    request<{ ok: boolean }>('/diagnostic/answer', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  completeDiagnostic: (sessionId: string) =>
    request<DiagnosticResult>('/diagnostic/complete', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  getDiagnosticResult: (sessionId: string) =>
    request<DiagnosticResult>(`/diagnostic/result/${sessionId}`),

  diagnosticChatStream: async (
    sessionId: string,
    questionId: number,
    message: string,
    history: { role: string; content: string }[],
    studentAnswer?: unknown,
  ): Promise<ReadableStream<Uint8Array>> => {
    const token = getToken()
    const res = await fetch(`${BASE}/diagnostic/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sessionId, questionId, message, history, studentAnswer }),
    })
    if (res.status === 401) {
      clearAuth()
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.body!
  },

  getSlideHint: (topicId: number, slideNumber: number) =>
    request<{ hint: string | null; type: string }>(`/student/presentation/${topicId}/slide-hints/${slideNumber}`),

  chatStream: async (topicId: number, message: string, slideContext?: SlideContext): Promise<ReadableStream<Uint8Array>> => {
    const token = getToken()
    const res = await fetch(`${BASE}/student/chat/${topicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, slideContext }),
    })
    if (res.status === 401) {
      clearAuth()
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.body!
  },
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

export interface DiagnosticSession {
  sessionId: string
  questions: DiagnosticQuestion[]
}

export interface DiagnosticQuestion extends Question {
  correctAnswer: unknown
  solution?: string
}

export interface DiagnosticResult {
  sessionId: string
  percentage: number
  topics: { id: number; grade: number; section: string; title: string; known: boolean }[]
  learningPlanId?: string
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

export interface PresentationSlide {
  slideNumber: number
  type: string
  title: string
  imagePath: string
  bulletPoints?: string[]
  slideTitle?: string
}

export interface SlideContext {
  slideNumber: number
  slideTitle: string
  slideBulletPoints: string[]
}

export interface PresentationVariant {
  presentationId: string
  style: string
  folderName: string
  totalSlides: number
  slides: PresentationSlide[]
}

export interface PresentationResponse {
  topicId: number
  topicTitle: string
  grade: number
  presentations: PresentationVariant[]
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

export interface Mission {
  id: number
  userId: string
  date: string
  missionType: string
  title: string
  description: string
  icon: string
  targetTopicId: number | null
  targetValue: number
  currentValue: number
  reward: number
  completed: boolean
  completedAt: string | null
}

export interface Gamification {
  userId: string
  coins: number
  streak: number
  freezes: number
  lastActiveDate: string | null
}

export interface Flashcard {
  id: number
  deckId: number
  front: string
  back: string
  cardType: string
  orderIndex: number
}

export interface FlashcardDeck {
  id: number
  topicId: number
  cardCount: number
  status: string
  cards: Flashcard[]
}

export interface FlashcardStats {
  total: number
  reviewed: number
  due: number
  mastered: number
}

export interface ReviewDueTopic {
  topicId: number
  topicTitle: string
  grade: number
  section: string
  score: number
  lastReviewedAt: string | null
  nextReviewAt: string | null
  intervalDays: number
}
