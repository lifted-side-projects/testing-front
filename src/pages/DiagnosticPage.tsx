import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api, type DiagnosticQuestion } from '@/lib/api'
import { setDiagnosticDone } from '@/lib/auth'
import { DiagnosticChat } from '@/components/DiagnosticChat'
import { Beaker, Check, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'loading' | 'question' | 'correct' | 'incorrect' | 'completing' | 'complete-error' | 'done'

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: 'Один ответ',
  multiple_choice: 'Несколько',
  matching: 'Соответствие',
  open_answer: 'Открытый',
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-0.5" title={`Сложность: ${level}/3`}>
      {[1, 2, 3].map(i => (
        <span
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-colors',
            i <= level ? 'bg-amber-400' : 'bg-ink-700',
          )}
        />
      ))}
    </span>
  )
}

function checkAnswerLocally(
  question: DiagnosticQuestion,
  answer: unknown,
): { isCorrect: boolean; score: number } {
  const correctAnswer = question.correctAnswer

  switch (question.questionType) {
    case 'single_choice': {
      const correct = (correctAnswer as string).toLowerCase()
      const student = (answer as string).toLowerCase()
      const isCorrect = student === correct
      return { isCorrect, score: isCorrect ? 1 : 0 }
    }
    case 'multiple_choice': {
      const correct = new Set((correctAnswer as string[]).map(s => s.toLowerCase()))
      const student = new Set((answer as string[]).map(s => s.toLowerCase()))
      let hits = 0
      for (const s of student) {
        if (correct.has(s)) hits++
      }
      const wrong = student.size - hits
      const score = correct.size > 0 ? Math.max(0, hits - wrong) / correct.size : 0
      const isCorrect = hits === correct.size && wrong === 0
      return { isCorrect, score }
    }
    case 'matching': {
      const correct = correctAnswer as Record<string, string>
      const student = answer as Record<string, string>
      const totalPairs = Object.keys(correct).length
      let correctPairs = 0
      for (const [key, value] of Object.entries(correct)) {
        if (student[key] === value) correctPairs++
      }
      const score = totalPairs > 0 ? correctPairs / totalPairs : 0
      return { isCorrect: score === 1, score }
    }
    case 'open_answer': {
      return { isCorrect: false, score: 0 }
    }
    default:
      return { isCorrect: false, score: 0 }
  }
}

/* ── Matching: tap-to-select with SVG connector lines ── */

interface MatchingQuestionProps {
  keys: string[]
  values: string[]
  pairs: Record<string, string>
  activeKey: string | null
  phase: Phase
  correctAnswer: Record<string, string>
  onKeyTap: (key: string) => void
  onValueTap: (val: string) => void
}

function MatchingQuestion({
  keys,
  values,
  pairs,
  activeKey,
  phase,
  correctAnswer,
  onKeyTap,
  onValueTap,
}: MatchingQuestionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const keyRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const valRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; key: string }[]>([])

  const pairedValues = new Set(Object.values(pairs))
  const showResult = phase === 'correct' || phase === 'incorrect'

  // Recompute SVG lines whenever pairs change
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const newLines: typeof lines = []

    for (const [k, v] of Object.entries(pairs)) {
      const keyEl = keyRefs.current.get(k)
      const valEl = valRefs.current.get(v)
      if (!keyEl || !valEl) continue
      const kr = keyEl.getBoundingClientRect()
      const vr = valEl.getBoundingClientRect()
      newLines.push({
        x1: kr.right - rect.left,
        y1: kr.top + kr.height / 2 - rect.top,
        x2: vr.left - rect.left,
        y2: vr.top + vr.height / 2 - rect.top,
        key: k,
      })
    }
    setLines(newLines)
  }, [pairs, keys, values])

  return (
    <div className="space-y-4">
      {phase === 'question' && (
        <p className="text-ink-500 text-xs">Нажми на элемент слева, затем на соответствие справа</p>
      )}
      <div ref={containerRef} className="relative flex gap-3">
        {/* SVG connector lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {lines.map((line) => {
            const correctVal = correctAnswer[line.key]
            const studentVal = pairs[line.key]
            const isCorrectPair = showResult && studentVal === correctVal
            const isWrongPair = showResult && studentVal && studentVal !== correctVal
            const color = isCorrectPair
              ? 'rgba(108, 186, 140, 0.6)' // sage
              : isWrongPair
                ? 'rgba(228, 105, 98, 0.6)' // coral
                : 'rgba(104, 168, 131, 0.45)' // sage muted

            const dx = (line.x2 - line.x1) * 0.4
            return (
              <path
                key={line.key}
                d={`M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${line.x2 - dx} ${line.y2}, ${line.x2} ${line.y2}`}
                stroke={color}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* Keys column */}
        <div className="flex-1 space-y-2 relative z-20">
          {keys.map((keyItem) => {
            const isPaired = !!pairs[keyItem]
            const isActive = activeKey === keyItem
            const correctVal = showResult ? correctAnswer[keyItem] : ''
            const isCorrectPair = showResult && pairs[keyItem] === correctVal
            const isWrongPair = showResult && pairs[keyItem] && !isCorrectPair

            return (
              <button
                key={keyItem}
                ref={(el) => { if (el) keyRefs.current.set(keyItem, el); else keyRefs.current.delete(keyItem) }}
                onClick={() => onKeyTap(keyItem)}
                disabled={phase !== 'question'}
                className={cn(
                  'w-full px-3 py-3 rounded-xl border text-sm text-left transition-all duration-200',
                  isCorrectPair
                    ? 'border-sage-500/50 bg-sage-500/15 text-sage-200'
                    : isWrongPair
                      ? 'border-coral-500/50 bg-coral-500/15 text-coral-200'
                      : isActive
                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30'
                        : isPaired
                          ? 'border-sage-500/30 bg-sage-500/10 text-sage-300'
                          : 'border-ink-700/40 bg-ink-800/30 text-ink-300',
                  phase === 'question' && 'active:scale-[0.97]',
                )}
              >
                {keyItem}
              </button>
            )
          })}
        </div>

        {/* Values column */}
        <div className="flex-1 space-y-2 relative z-20">
          {values.map((val) => {
            const isPairedTo = pairedValues.has(val)
            const pairedKey = Object.entries(pairs).find(([, v]) => v === val)?.[0]
            const isCorrectForPair = showResult && pairedKey && correctAnswer[pairedKey] === val
            const isWrongForPair = showResult && pairedKey && !isCorrectForPair

            return (
              <button
                key={val}
                ref={(el) => { if (el) valRefs.current.set(val, el); else valRefs.current.delete(val) }}
                onClick={() => onValueTap(val)}
                disabled={phase !== 'question'}
                className={cn(
                  'w-full px-3 py-3 rounded-xl border text-sm text-left transition-all duration-200',
                  isCorrectForPair
                    ? 'border-sage-500/50 bg-sage-500/15 text-sage-200'
                    : isWrongForPair
                      ? 'border-coral-500/50 bg-coral-500/15 text-coral-200'
                      : isPairedTo
                        ? 'border-sage-500/30 bg-sage-500/10 text-sage-300'
                        : activeKey
                          ? 'border-amber-400/30 bg-ink-800/40 text-ink-200 ring-1 ring-amber-400/20'
                          : 'border-ink-700/40 bg-ink-800/30 text-ink-300',
                  phase === 'question' && 'active:scale-[0.97]',
                )}
              >
                {val}
              </button>
            )
          })}
        </div>
      </div>

      {/* Show correct answers for wrong pairs */}
      {showResult && (
        <div className="space-y-1">
          {keys.map((keyItem) => {
            const correctVal = correctAnswer[keyItem]
            const studentVal = pairs[keyItem]
            if (studentVal === correctVal) return null
            return (
              <p key={keyItem} className="text-sage-400 text-xs">
                {keyItem} → {correctVal}
              </p>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function DiagnosticPage() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('loading')
  const [sessionId, setSessionId] = useState('')
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<unknown>(null)
  const [openAnswer, setOpenAnswer] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  // Per-question results: 'correct' | 'incorrect' | null (unanswered)
  const [questionResults, setQuestionResults] = useState<(null | 'correct' | 'incorrect')[]>([])
  // Auto-open review overlay after a brief delay showing the wrong answer highlight
  const [showReviewOverlay, setShowReviewOverlay] = useState(false)
  // Matching: which key is actively selected
  const [activeMatchKey, setActiveMatchKey] = useState<string | null>(null)
  const failedAnswersRef = useRef<{ sessionId: string; questionId: number; answer: unknown; isCorrect: boolean; score: number }[]>([])

  const startMutation = useMutation({
    mutationFn: api.startDiagnostic,
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setQuestions(data.questions)
      setQuestionResults(new Array(data.questions.length).fill(null))
      setPhase('question')
    },
  })

  const queryClient = useQueryClient()

  const completeMutation = useMutation({
    mutationFn: (sid: string) => api.completeDiagnostic(sid),
    onSuccess: (result) => {
      setDiagnosticDone()
      queryClient.invalidateQueries({ queryKey: ['knowledge-map'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] })
      queryClient.invalidateQueries({ queryKey: ['learning-plan'] })
      queryClient.invalidateQueries({ queryKey: ['current-lesson'] })
      queryClient.invalidateQueries({ queryKey: ['weak-topics'] })
      navigate(`/diagnostic/result/${result.sessionId}`, { state: { result } })
    },
    onError: () => {
      setPhase('complete-error')
    },
  })

  useEffect(() => {
    startMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-open review overlay 800ms after incorrect answer (let user see the highlighted wrong answer first)
  useEffect(() => {
    if (phase !== 'incorrect') return
    const timer = setTimeout(() => setShowReviewOverlay(true), 800)
    return () => clearTimeout(timer)
  }, [phase])

  const question = questions[currentIdx]

  const handleAnswer = useCallback(() => {
    if (!question) return

    const actualAnswer = question.questionType === 'open_answer' ? openAnswer.trim() : selectedAnswer
    if (actualAnswer === null || actualAnswer === '') return

    const result = checkAnswerLocally(question, actualAnswer)

    if (result.isCorrect) {
      setCorrectCount(c => c + 1)
      setQuestionResults(prev => { const next = [...prev]; next[currentIdx] = 'correct'; return next })
      setPhase('correct')
    } else {
      setIncorrectCount(c => c + 1)
      setQuestionResults(prev => { const next = [...prev]; next[currentIdx] = 'incorrect'; return next })
      setPhase('incorrect')
    }

    const answerData = {
      sessionId,
      questionId: question.id,
      answer: actualAnswer,
      isCorrect: result.isCorrect,
      score: result.score,
    }

    const toSend = [...failedAnswersRef.current, answerData]
    failedAnswersRef.current = []

    for (const data of toSend) {
      api.recordDiagnosticAnswer(data).catch(() => {
        failedAnswersRef.current.push(data)
      })
    }
  }, [question, selectedAnswer, openAnswer, sessionId])

  const goToNextQuestion = useCallback(() => {
    setShowReviewOverlay(false)
    if (currentIdx + 1 >= questions.length) {
      setPhase('completing')
      completeMutation.mutate(sessionId)
    } else {
      setCurrentIdx(i => i + 1)
      setSelectedAnswer(null)
      setOpenAnswer('')
      setActiveMatchKey(null)
      setPhase('question')
    }
  }, [currentIdx, questions.length, sessionId, completeMutation])

  // Loading state
  if (phase === 'loading' || startMutation.isPending) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 page-enter">
        <Beaker size={40} className="text-amber-400 animate-pulse" />
        <p className="text-ink-400">Подготавливаем диагностику...</p>
      </div>
    )
  }

  if (startMutation.isError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-coral-400 text-sm">Ошибка: {startMutation.error?.message}</p>
        <button onClick={() => startMutation.mutate()} className="text-amber-400 text-sm underline">
          Попробовать снова
        </button>
      </div>
    )
  }

  if (phase === 'completing') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 page-enter">
        <Beaker size={40} className="text-amber-400 animate-pulse" />
        <p className="text-ink-400">Формируем результаты...</p>
      </div>
    )
  }

  if (phase === 'complete-error') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-coral-400 text-sm">Не удалось завершить диагностику</p>
        <p className="text-ink-500 text-xs">{completeMutation.error?.message}</p>
        <button
          onClick={() => {
            setPhase('completing')
            completeMutation.mutate(sessionId)
          }}
          className="text-amber-400 text-sm underline"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  if (!question) return null

  const correctAnswerForHighlight = question.correctAnswer
  const difficulty = question.difficulty ?? 1
  const typeLabel = QUESTION_TYPE_LABELS[question.questionType] || question.questionType

  // Matching helpers
  const matchingPairs = (selectedAnswer as Record<string, string>) || {}
  const pairedValues = new Set(Object.values(matchingPairs))

  return (
    <div className="min-h-dvh flex flex-col px-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-ink-400 text-sm font-mono">
            {currentIdx + 1}/{questions.length}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-ink-800/60 text-ink-400 text-[10px] font-medium uppercase tracking-wide">
            {typeLabel}
          </span>
          <DifficultyDots level={difficulty} />
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs">
            <Check size={12} className="text-sage-400" />
            <span className="text-sage-400 font-mono">{correctCount}</span>
          </span>
          <span className="flex items-center gap-1 text-xs">
            <X size={12} className="text-coral-400" />
            <span className="text-coral-400 font-mono">{incorrectCount}</span>
          </span>
        </div>
      </div>

      {/* Progress dots — one per question */}
      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {questionResults.map((result, i) => (
          <span
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-colors duration-300',
              i === currentIdx
                ? result === 'correct'
                  ? 'bg-sage-400 ring-2 ring-sage-400/40'
                  : result === 'incorrect'
                    ? 'bg-coral-400 ring-2 ring-coral-400/40'
                    : 'bg-amber-400 ring-2 ring-amber-400/40'
                : result === 'correct'
                  ? 'bg-sage-500'
                  : result === 'incorrect'
                    ? 'bg-coral-500'
                    : 'bg-ink-600',
            )}
          />
        ))}
      </div>

      {/* Question with slide animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex-1 overflow-y-auto"
        >
          <div className="text-[15px] text-ink-200 leading-relaxed mb-5 whitespace-pre-line">
            {question.text}
          </div>

          {question.questionType === 'multiple_choice' && phase === 'question' && (
            <div className="flex items-center gap-2 mb-3 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
              <span className="text-violet-400 text-xs font-medium">Несколько вариантов</span>
            </div>
          )}

          {/* Single choice */}
          {question.questionType === 'single_choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((optObj, i) => {
                const key = Object.keys(optObj)[0]
                const text = optObj[key]
                const isSelected = selectedAnswer === key
                const showResult = phase === 'correct' || phase === 'incorrect'
                const isCorrectOption = showResult && (correctAnswerForHighlight as string).toLowerCase() === key.toLowerCase()
                const isWrongSelected = showResult && isSelected && !isCorrectOption

                return (
                  <button
                    key={i}
                    onClick={() => { if (phase === 'question') setSelectedAnswer(key) }}
                    disabled={phase !== 'question'}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-300',
                      isCorrectOption
                        ? 'border-sage-500/60 bg-sage-500/15'
                        : isWrongSelected
                          ? 'border-coral-500/60 bg-coral-500/15'
                          : isSelected
                            ? 'border-amber-400/50 bg-amber-400/10'
                            : 'border-ink-700/40 bg-ink-800/30',
                      phase === 'question' && !isSelected && 'active:bg-ink-800/60',
                    )}
                  >
                    <span className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors duration-300',
                      isCorrectOption ? 'bg-sage-500 text-white' :
                      isWrongSelected ? 'bg-coral-500 text-white' :
                      isSelected ? 'bg-amber-400 text-ink-950' : 'bg-ink-700/50 text-ink-400',
                    )}>
                      {isCorrectOption ? <Check size={14} /> : isWrongSelected ? <X size={14} /> : key.toUpperCase()}
                    </span>
                    <span className={cn(
                      'text-sm leading-relaxed transition-colors duration-300',
                      isCorrectOption ? 'text-sage-200' :
                      isWrongSelected ? 'text-coral-200' :
                      isSelected ? 'text-ink-100' : 'text-ink-300',
                    )}>
                      {text}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Multiple choice */}
          {question.questionType === 'multiple_choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((optObj, i) => {
                const key = Object.keys(optObj)[0]
                const text = optObj[key]
                const selected = (selectedAnswer as string[] || [])
                const isSelected = selected.includes(key)
                const showResult = phase === 'correct' || phase === 'incorrect'
                const correctArr = showResult ? (correctAnswerForHighlight as string[]).map(s => s.toLowerCase()) : []
                const isCorrectOption = showResult && correctArr.includes(key.toLowerCase())
                const isWrongSelected = showResult && isSelected && !isCorrectOption

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (phase !== 'question') return
                      const newVal = isSelected ? selected.filter(x => x !== key) : [...selected, key]
                      setSelectedAnswer(newVal)
                    }}
                    disabled={phase !== 'question'}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-300',
                      isCorrectOption
                        ? 'border-sage-500/60 bg-sage-500/15'
                        : isWrongSelected
                          ? 'border-coral-500/60 bg-coral-500/15'
                          : isSelected
                            ? 'border-violet-400/50 bg-violet-400/10'
                            : 'border-ink-700/40 bg-ink-800/30',
                    )}
                  >
                    <span className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors',
                      isCorrectOption ? 'bg-sage-500 text-white' :
                      isWrongSelected ? 'bg-coral-500 text-white' :
                      isSelected ? 'bg-violet-400 text-ink-950' : 'bg-ink-700/50 text-ink-400',
                    )}>
                      {isCorrectOption ? <Check size={14} /> : isWrongSelected ? <X size={14} /> : isSelected ? '✓' : key.toUpperCase()}
                    </span>
                    <span className={cn('text-sm leading-relaxed', isSelected ? 'text-ink-100' : 'text-ink-300')}>
                      {text}
                    </span>
                  </button>
                )
              })}
              {phase === 'question' && (
                <p className="text-ink-500 text-xs mt-2">Можно выбрать несколько вариантов</p>
              )}
            </div>
          )}

          {/* Matching — tap-to-select */}
          {question.questionType === 'matching' && question.keys && question.values && (
            <MatchingQuestion
              keys={question.keys}
              values={question.values}
              pairs={matchingPairs}
              activeKey={activeMatchKey}
              phase={phase}
              correctAnswer={correctAnswerForHighlight as Record<string, string>}
              onKeyTap={(keyItem) => {
                if (phase !== 'question') return
                if (activeMatchKey === keyItem) {
                  setActiveMatchKey(null)
                } else if (matchingPairs[keyItem]) {
                  const next = { ...matchingPairs }
                  delete next[keyItem]
                  setSelectedAnswer(next)
                  setActiveMatchKey(keyItem)
                } else {
                  setActiveMatchKey(keyItem)
                }
              }}
              onValueTap={(val) => {
                if (phase !== 'question' || !activeMatchKey) return
                const next = { ...matchingPairs }
                for (const [k, v] of Object.entries(next)) {
                  if (v === val) delete next[k]
                }
                next[activeMatchKey] = val
                setSelectedAnswer(next)
                setActiveMatchKey(null)
              }}
            />
          )}

          {/* Open answer */}
          {question.questionType === 'open_answer' && (
            <div className="space-y-3">
              <textarea
                value={openAnswer}
                onChange={e => { if (phase === 'question') setOpenAnswer(e.target.value) }}
                disabled={phase !== 'question'}
                placeholder="Напиши свой ответ..."
                rows={4}
                className={cn(
                  'w-full border rounded-xl px-4 py-3 text-sm leading-relaxed focus:outline-none transition-colors resize-none',
                  phase !== 'question'
                    ? 'bg-ink-800/40 border-ink-700/30 text-ink-400'
                    : 'bg-ink-800/60 border-ink-700/50 text-ink-100 focus:border-amber-400/40 placeholder-ink-500',
                )}
              />
              {phase !== 'question' && (
                <p className="text-ink-500 text-xs">Ответ отправлен на проверку</p>
              )}
            </div>
          )}

          {/* Feedback: correct — with "Далее" button (no auto-advance) */}
          {phase === 'correct' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-sage-500/10 border border-sage-500/20 animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full bg-sage-500/30 flex items-center justify-center">
                  <Check size={16} className="text-sage-300" />
                </div>
                <span className="text-sage-200 text-sm font-medium">Правильно!</span>
              </div>
              <button
                onClick={goToNextQuestion}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-amber-400 text-ink-950 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                Далее
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Feedback: incorrect — overlay opens automatically after brief delay */}
          {phase === 'incorrect' && (
            <div className="mt-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-coral-500/10 border border-coral-500/20 animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full bg-coral-500/30 flex items-center justify-center">
                  <X size={16} className="text-coral-300" />
                </div>
                <span className="text-coral-200 text-sm font-medium">Неправильно — разбираем...</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom action — only in question phase */}
      {phase === 'question' && (
        <div className="mt-6 pt-4 border-t border-ink-800/50">
          <button
            onClick={handleAnswer}
            disabled={
              question.questionType === 'open_answer'
                ? !openAnswer.trim()
                : question.questionType === 'matching'
                  ? !question.keys || Object.keys(matchingPairs).length < question.keys.length
                  : selectedAnswer === null || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)
            }
            className={cn(
              'w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200',
              (question.questionType === 'open_answer'
                ? !!openAnswer.trim()
                : question.questionType === 'matching'
                  ? question.keys && Object.keys(matchingPairs).length >= question.keys.length
                  : selectedAnswer !== null && !(Array.isArray(selectedAnswer) && selectedAnswer.length === 0))
                ? 'bg-amber-400 text-ink-950 active:scale-[0.98]'
                : 'bg-ink-800 text-ink-500 cursor-not-allowed',
            )}
          >
            Проверить
          </button>
        </div>
      )}

      {/* Review overlay with chat — mandatory, no skip */}
      <AnimatePresence>
        {showReviewOverlay && phase === 'incorrect' && (
          <DiagnosticChat
            sessionId={sessionId}
            questionId={question.id}
            studentAnswer={selectedAnswer}
            onComplete={goToNextQuestion}
            correctAnswer={question.correctAnswer}
            questionText={question.text}
            questionType={question.questionType}
            options={question.options}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
