import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, type Question } from '@/lib/api'
import { setDiagnosticDone } from '@/lib/auth'
import { Button } from '@/components/Button'
import { ChevronLeft, ChevronRight, Send, Beaker } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DiagnosticPage() {
  const navigate = useNavigate()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, unknown>>({})

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['diagnostic-questions'],
    queryFn: api.getQuestions,
  })

  const submitMutation = useMutation({
    mutationFn: (formatted: { questionId: number; answer: unknown }[]) =>
      api.submitDiagnostic(formatted),
    onSuccess: (result) => {
      setDiagnosticDone()
      navigate('/diagnostic/result', { state: { result } })
    },
  })

  const question = questions[currentIdx]
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0
  const answeredCount = Object.keys(answers).length

  function setAnswer(questionId: number, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function handleSubmit() {
    const formatted = Object.entries(answers).map(([qId, ans]) => ({
      questionId: Number(qId),
      answer: ans,
    }))
    submitMutation.mutate(formatted)
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 page-enter">
        <Beaker size={40} className="text-amber-400 animate-pulse" />
        <p className="text-ink-400">Загружаем вопросы...</p>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className="min-h-dvh flex flex-col px-5 py-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-ink-400 text-sm font-mono">
          {currentIdx + 1} / {questions.length}
        </span>
        <span className="text-ink-500 text-xs">
          Ответов: {answeredCount}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-ink-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 fade-in overflow-y-auto" key={currentIdx}>
        <div className="text-[15px] text-ink-200 leading-relaxed mb-5 whitespace-pre-line">
          {question.text}
        </div>

        {/* Single choice — options are [{a: "text"}, {b: "text"}] */}
        {question.questionType === 'single_choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((optObj, i) => {
              const key = Object.keys(optObj)[0]
              const text = optObj[key]
              const isSelected = answers[question.id] === key
              return (
                <button
                  key={i}
                  onClick={() => setAnswer(question.id, key)}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                    isSelected
                      ? 'border-amber-400/50 bg-amber-400/10'
                      : 'border-ink-700/40 bg-ink-800/30 active:bg-ink-800/60'
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                    isSelected ? 'bg-amber-400 text-ink-950' : 'bg-ink-700/50 text-ink-400'
                  )}>
                    {key.toUpperCase()}
                  </span>
                  <span className={cn(
                    'text-sm leading-relaxed',
                    isSelected ? 'text-ink-100' : 'text-ink-300'
                  )}>
                    {text}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Multiple choice — same option format */}
        {question.questionType === 'multiple_choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((optObj, i) => {
              const key = Object.keys(optObj)[0]
              const text = optObj[key]
              const selected = (answers[question.id] as string[] || [])
              const isSelected = selected.includes(key)
              return (
                <button
                  key={i}
                  onClick={() => {
                    const newVal = isSelected
                      ? selected.filter((x) => x !== key)
                      : [...selected, key]
                    setAnswer(question.id, newVal)
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                    isSelected
                      ? 'border-violet-400/50 bg-violet-400/10'
                      : 'border-ink-700/40 bg-ink-800/30 active:bg-ink-800/60'
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                    isSelected ? 'bg-violet-400 text-ink-950' : 'bg-ink-700/50 text-ink-400'
                  )}>
                    {isSelected ? '✓' : key.toUpperCase()}
                  </span>
                  <span className={cn('text-sm leading-relaxed', isSelected ? 'text-ink-100' : 'text-ink-300')}>
                    {text}
                  </span>
                </button>
              )
            })}
            <p className="text-ink-500 text-xs mt-2">Можно выбрать несколько вариантов</p>
          </div>
        )}

        {/* Matching — keys[] + values[] */}
        {question.questionType === 'matching' && question.keys && question.values && (
          <div className="space-y-3">
            {question.keys.map((keyItem, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-ink-300 text-sm flex-1 bg-ink-800/30 rounded-xl px-3 py-3 border border-ink-700/30">
                  {keyItem}
                </span>
                <span className="text-ink-500 shrink-0">→</span>
                <select
                  value={(answers[question.id] as Record<string, string> || {})[keyItem] || ''}
                  onChange={(e) => {
                    const current = (answers[question.id] as Record<string, string>) || {}
                    setAnswer(question.id, { ...current, [keyItem]: e.target.value })
                  }}
                  className="flex-1 bg-ink-800/60 border border-ink-700/50 rounded-xl px-3 py-3 text-sm text-ink-100 focus:outline-none focus:border-amber-400/40"
                >
                  <option value="">Выбери...</option>
                  {question.values?.map((val, j) => (
                    <option key={j} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-ink-800/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft size={18} />
        </Button>

        {/* Question dots */}
        <div className="flex-1 flex items-center justify-center gap-1 overflow-hidden">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all shrink-0',
                i === currentIdx ? 'w-6 bg-amber-400' :
                answers[q.id] !== undefined ? 'bg-sage-500' : 'bg-ink-700'
              )}
            />
          ))}
        </div>

        {currentIdx < questions.length - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
          >
            <ChevronRight size={18} />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={submitMutation.isPending}
            disabled={answeredCount < questions.length * 0.5}
            className="flex items-center gap-1"
          >
            <Send size={14} />
            Отправить
          </Button>
        )}
      </div>
    </div>
  )
}
