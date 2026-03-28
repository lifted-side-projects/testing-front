import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'
import { ArrowLeft, ChevronLeft, ChevronRight, Send, Loader2, Clock, ClipboardList } from 'lucide-react'
import { addCoins } from '@/lib/gamification'
import { incrementMission } from '@/lib/missions'

export function QuizPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, unknown>>({})
  const startTimeRef = useRef(Date.now())

  const tid = Number(topicId)

  // Read-only: fetch existing quiz session (no generation)
  const { data: session, isLoading, isError } = useQuery({
    queryKey: ['quiz-available', tid],
    queryFn: () => api.getAvailableQuiz(tid),
    staleTime: Infinity,
    retry: false,
  })

  const submitMutation = useMutation({
    mutationFn: (data: { sessionId: string; answers: Record<number, unknown> }) =>
      api.submitQuiz(data.sessionId, data.answers),
    onSuccess: (result) => {
      addCoins(result.passed ? 20 : 5)
      incrementMission('solve_tests')
      const percentage = result.score <= 1 ? result.score * 100 : result.score
      if (percentage >= 80) {
        incrementMission('perfect_score')
      }
      navigate(`/quiz/${session!.sessionId}/result`, { state: { result, topicId: tid } })
    },
  })

  const questions = session?.questions || []
  const question = questions[currentIdx]
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0
  const answeredCount = Object.keys(answers).length

  function setAnswer(qId: number, value: unknown) {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  function handleSubmit() {
    if (!session) return
    submitMutation.mutate({ sessionId: session.sessionId, answers })
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 page-enter">
        <Loader2 size={32} className="text-violet-400 animate-spin" />
        <p className="text-ink-400 text-sm">Загрузка...</p>
      </div>
    )
  }

  // Submitting — fullscreen loader (AI checking takes time)
  if (submitMutation.isPending) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 page-enter">
        <Loader2 size={32} className="text-violet-400 animate-spin" />
        <h2 className="font-display text-lg font-semibold text-ink-100 text-center">Проверяем ответы</h2>
        <p className="text-ink-500 text-sm text-center max-w-[240px]">AI анализирует твои ответы, это может занять до минуты</p>
      </div>
    )
  }

  // No quiz available
  if (isError || !session || !questions.length) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 page-enter">
        <div className="w-20 h-20 rounded-3xl bg-ink-800/30 border border-ink-700/30 flex items-center justify-center mb-6">
          <ClipboardList size={32} className="text-ink-500" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink-200 mb-2 text-center">
          Тест не готов
        </h2>
        <p className="text-ink-500 text-sm text-center max-w-[280px] mb-8">
          Тренажёр по этой теме ещё не создан. Генерация происходит через админ-панель.
        </p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Назад</Button>
      </div>
    )
  }

  if (!question) return null

  const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <div className="min-h-dvh flex flex-col page-enter">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="text-ink-400">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-ink-500" />
            <span className="text-ink-400 text-sm font-mono">{mins}:{secs.toString().padStart(2, '0')}</span>
          </div>
          <span className="text-ink-400 text-sm font-mono">
            {currentIdx + 1}/{questions.length}
          </span>
        </div>

        {/* Progress */}
        <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-5 py-5 overflow-y-auto fade-in" key={currentIdx}>
        {/* Question type badge */}
        <div className="mb-3">
          <span className={cn(
            'text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-md',
            question.questionType === 'single_choice' ? 'bg-sage-500/15 text-sage-400' :
            question.questionType === 'multiple_choice' ? 'bg-violet-500/15 text-violet-400' :
            'bg-amber-400/15 text-amber-400'
          )}>
            {question.questionType === 'single_choice' ? 'Один ответ' :
             question.questionType === 'multiple_choice' ? 'Несколько ответов' :
             'Открытый ответ'}
          </span>
        </div>

        <h2 className="text-[15px] text-ink-200 leading-relaxed mb-6">
          {question.questionText}
        </h2>

        {/* Single choice */}
        {question.questionType === 'single_choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((opt, i) => {
              const letter = opt.label || String.fromCharCode(65 + i)
              const isSelected = answers[question.id] === letter
              return (
                <button
                  key={i}
                  onClick={() => setAnswer(question.id, letter)}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'border-violet-400/50 bg-violet-400/10'
                      : 'border-ink-700/40 bg-ink-800/30 active:bg-ink-800/60'
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    isSelected ? 'bg-violet-400 text-ink-950' : 'bg-ink-700/50 text-ink-400'
                  )}>
                    {letter}
                  </span>
                  <span className={cn('text-sm leading-relaxed', isSelected ? 'text-ink-100' : 'text-ink-300')}>
                    {opt.text}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Multiple choice */}
        {question.questionType === 'multiple_choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((opt, i) => {
              const letter = opt.label || String.fromCharCode(65 + i)
              const selected = (answers[question.id] as string[] || [])
              const isSelected = selected.includes(letter)
              return (
                <button
                  key={i}
                  onClick={() => {
                    const newVal = isSelected
                      ? selected.filter((x) => x !== letter)
                      : [...selected, letter]
                    setAnswer(question.id, newVal)
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'border-sage-400/50 bg-sage-400/10'
                      : 'border-ink-700/40 bg-ink-800/30 active:bg-ink-800/60'
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    isSelected ? 'bg-sage-400 text-ink-950' : 'bg-ink-700/50 text-ink-400'
                  )}>
                    {isSelected ? '✓' : letter}
                  </span>
                  <span className={cn('text-sm leading-relaxed', isSelected ? 'text-ink-100' : 'text-ink-300')}>
                    {opt.text}
                  </span>
                </button>
              )
            })}
            <p className="text-ink-500 text-xs">Можно выбрать несколько вариантов</p>
          </div>
        )}

        {/* Open answer */}
        {question.questionType === 'open_answer' && (
          <div>
            <textarea
              value={(answers[question.id] as string) || ''}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder="Напиши свой ответ..."
              rows={5}
              className="w-full bg-ink-800/60 border border-ink-700/50 rounded-xl px-4 py-3 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-amber-400/30 resize-none"
            />
            <p className="text-ink-500 text-xs mt-2">AI проверит ваш ответ</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-5 py-4 border-t border-ink-800/50 flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft size={18} />
        </Button>

        <div className="flex-1 flex items-center justify-center gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                i === currentIdx ? 'w-5 bg-violet-400' :
                answers[q.id] !== undefined ? 'bg-sage-500' : 'bg-ink-700'
              )}
            />
          ))}
        </div>

        {currentIdx < questions.length - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIdx((i) => i + 1)}
          >
            <ChevronRight size={18} />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={submitMutation.isPending}
            disabled={answeredCount < questions.length}
            className="flex items-center gap-1"
          >
            <Send size={14} />
            Готово
          </Button>
        )}
      </div>
    </div>
  )
}
