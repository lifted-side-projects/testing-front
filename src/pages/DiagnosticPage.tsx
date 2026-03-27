import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type DiagnosticQuestion } from '@/lib/api'
import { setDiagnosticDone } from '@/lib/auth'
import { DiagnosticChat } from '@/components/DiagnosticChat'
import { Beaker, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'loading' | 'question' | 'correct' | 'incorrect' | 'completing' | 'complete-error' | 'done'

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
      // Open answers are always sent to backend for AI evaluation; locally mark as "needs review"
      return { isCorrect: false, score: 0 }
    }
    default:
      return { isCorrect: false, score: 0 }
  }
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
  const failedAnswersRef = useRef<{ sessionId: string; questionId: number; answer: unknown; isCorrect: boolean; score: number }[]>([])

  // Start diagnostic session on mount
  const startMutation = useMutation({
    mutationFn: api.startDiagnostic,
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setQuestions(data.questions)
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

  const question = questions[currentIdx]

  const handleAnswer = useCallback(() => {
    if (!question) return

    const actualAnswer = question.questionType === 'open_answer' ? openAnswer.trim() : selectedAnswer
    if (actualAnswer === null || actualAnswer === '') return

    const result = checkAnswerLocally(question, actualAnswer)

    if (result.isCorrect) {
      setCorrectCount(c => c + 1)
      setPhase('correct')
    } else {
      setIncorrectCount(c => c + 1)
      setPhase('incorrect')
    }

    const answerData = {
      sessionId,
      questionId: question.id,
      answer: actualAnswer,
      isCorrect: result.isCorrect,
      score: result.score,
    }

    // Flush any previously failed answers first, then record current
    const toSend = [...failedAnswersRef.current, answerData]
    failedAnswersRef.current = []

    for (const data of toSend) {
      api.recordDiagnosticAnswer(data).catch(() => {
        failedAnswersRef.current.push(data)
      })
    }
  }, [question, selectedAnswer, openAnswer, sessionId])

  const goToNextQuestion = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setPhase('completing')
      completeMutation.mutate(sessionId)
    } else {
      setCurrentIdx(i => i + 1)
      setSelectedAnswer(null)
      setOpenAnswer('')
      setPhase('question')
    }
  }, [currentIdx, questions.length, sessionId, completeMutation])

  // Auto-advance after correct answer
  useEffect(() => {
    if (phase !== 'correct') return
    const timer = setTimeout(goToNextQuestion, 1500)
    return () => clearTimeout(timer)
  }, [phase, goToNextQuestion])

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

  return (
    <div className="min-h-dvh flex flex-col px-5 py-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-ink-400 text-sm font-mono">
          {currentIdx + 1} / {questions.length}
        </span>
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

      {/* Progress bar */}
      <div className="h-1.5 bg-ink-800 rounded-full mb-6 overflow-hidden flex">
        <div
          className="h-full bg-sage-500 rounded-full transition-all duration-500"
          style={{ width: `${(correctCount / Math.max(questions.length, 1)) * 100}%` }}
        />
        <div
          className="h-full bg-coral-500 rounded-full transition-all duration-500"
          style={{ width: `${(incorrectCount / Math.max(questions.length, 1)) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto" key={`q-${currentIdx}`}>
        <div className="text-[15px] text-ink-200 leading-relaxed mb-5 whitespace-pre-line">
          {question.text}
        </div>

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

        {/* Matching */}
        {question.questionType === 'matching' && question.keys && question.values && (
          <div className="space-y-3">
            {question.keys.map((keyItem, i) => {
              const currentVal = (selectedAnswer as Record<string, string> || {})[keyItem] || ''
              const showResult = phase === 'correct' || phase === 'incorrect'
              const correctVal = showResult ? (correctAnswerForHighlight as Record<string, string>)[keyItem] : ''
              const isCorrectPair = showResult && currentVal === correctVal
              const isWrongPair = showResult && currentVal && !isCorrectPair

              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm flex-1 rounded-xl px-3 py-3 border transition-colors',
                    isCorrectPair ? 'text-sage-200 bg-sage-500/10 border-sage-500/30' :
                    isWrongPair ? 'text-coral-200 bg-coral-500/10 border-coral-500/30' :
                    'text-ink-300 bg-ink-800/30 border-ink-700/30',
                  )}>
                    {keyItem}
                  </span>
                  <span className="text-ink-500 shrink-0">→</span>
                  <select
                    value={currentVal}
                    onChange={(e) => {
                      if (phase !== 'question') return
                      const current = (selectedAnswer as Record<string, string>) || {}
                      setSelectedAnswer({ ...current, [keyItem]: e.target.value })
                    }}
                    disabled={phase !== 'question'}
                    className={cn(
                      'flex-1 border rounded-xl px-3 py-3 text-sm focus:outline-none transition-colors',
                      isCorrectPair ? 'bg-sage-500/10 border-sage-500/30 text-sage-200' :
                      isWrongPair ? 'bg-coral-500/10 border-coral-500/30 text-coral-200' :
                      'bg-ink-800/60 border-ink-700/50 text-ink-100 focus:border-amber-400/40',
                    )}
                  >
                    <option value="">Выбери...</option>
                    {question.values?.map((val, j) => (
                      <option key={j} value={val}>{val}</option>
                    ))}
                  </select>
                  {showResult && isWrongPair && (
                    <span className="text-sage-400 text-xs shrink-0 ml-1">({correctVal})</span>
                  )}
                </div>
              )
            })}
          </div>
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

        {/* Feedback for correct */}
        {phase === 'correct' && (
          <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-sage-500/10 border border-sage-500/20 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-full bg-sage-500/30 flex items-center justify-center">
              <Check size={16} className="text-sage-300" />
            </div>
            <span className="text-sage-200 text-sm font-medium">Правильно!</span>
          </div>
        )}

        {/* Feedback + Chat for incorrect */}
        {phase === 'incorrect' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-coral-500/10 border border-coral-500/20 animate-in fade-in duration-300">
              <div className="w-8 h-8 rounded-full bg-coral-500/30 flex items-center justify-center">
                <X size={16} className="text-coral-300" />
              </div>
              <span className="text-coral-200 text-sm font-medium">Неправильно — давай разберёмся</span>
            </div>

            <DiagnosticChat
              sessionId={sessionId}
              questionId={question.id}
              studentAnswer={selectedAnswer}
              onComplete={goToNextQuestion}
            />
          </div>
        )}
      </div>

      {/* Bottom action - only in question phase */}
      {phase === 'question' && (
        <div className="mt-6 pt-4 border-t border-ink-800/50">
          <button
            onClick={handleAnswer}
            disabled={
              question.questionType === 'open_answer'
                ? !openAnswer.trim()
                : selectedAnswer === null || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)
            }
            className={cn(
              'w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200',
              (question.questionType === 'open_answer' ? !!openAnswer.trim() : selectedAnswer !== null && !(Array.isArray(selectedAnswer) && selectedAnswer.length === 0))
                ? 'bg-amber-400 text-ink-950 active:scale-[0.98]'
                : 'bg-ink-800 text-ink-500 cursor-not-allowed',
            )}
          >
            Проверить
          </button>
        </div>
      )}
    </div>
  )
}
