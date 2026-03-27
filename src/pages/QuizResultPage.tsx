import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'
import {
  Trophy, XCircle, CheckCircle2, ArrowRight, RotateCcw,
  MessageSquare, Coins, Brain,
} from 'lucide-react'
import type { QuizResult } from '@/lib/api'
import { addCardsFromQuizResult } from '@/lib/srs'
import { ShareButton } from '@/components/ShareButton'

// Resolve letter label (e.g. "B") to option text using options array
function resolveAnswer(
  answer: unknown,
  options?: { label: string; text: string }[] | null,
): string {
  if (!answer) return '—'
  if (!options || options.length === 0) return String(answer)

  // Single letter: "B" → find option with label "B"
  if (typeof answer === 'string') {
    const opt = options.find((o) => o.label.toUpperCase() === answer.toUpperCase())
    return opt ? opt.text : String(answer)
  }

  // Array of letters: ["A","C"] → resolve each
  if (Array.isArray(answer)) {
    return answer
      .map((a) => {
        const opt = options.find((o) => o.label.toUpperCase() === String(a).toUpperCase())
        return opt ? opt.text : String(a)
      })
      .join(', ')
  }

  return String(answer)
}

export function QuizResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result as QuizResult | undefined
  const topicId = location.state?.topicId as number | undefined
  const [srsAdded, setSrsAdded] = useState(0)

  useEffect(() => {
    if (result?.answers && topicId) {
      const added = addCardsFromQuizResult(result.answers, topicId)
      setSrsAdded(added)
    }
  }, [result, topicId])

  if (!result || !result.answers) {
    navigate('/')
    return null
  }

  const percentage = result.score <= 1 ? Math.round(result.score * 100) : Math.round(result.score)
  const passed = result.passed

  return (
    <div className="min-h-dvh flex flex-col px-5 py-6 page-enter">
      {/* Header animation */}
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none" style={{
        background: passed
          ? 'radial-gradient(ellipse at top, rgba(82, 183, 136, 0.12) 0%, transparent 60%)'
          : 'radial-gradient(ellipse at top, rgba(231, 111, 81, 0.12) 0%, transparent 60%)'
      }} />

      {/* Score */}
      <div className="text-center mb-8 pt-8 relative">
        <div className={cn(
          'w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center',
          passed ? 'bg-sage-500/15 border-2 border-sage-500/30' : 'bg-coral-500/15 border-2 border-coral-500/30'
        )}>
          {passed ? (
            <Trophy size={40} className="text-sage-400" />
          ) : (
            <RotateCcw size={36} className="text-coral-400" />
          )}
        </div>

        <h1 className="font-display text-3xl font-bold text-ink-50 mb-1">
          {percentage}%
        </h1>
        <p className={cn(
          'text-base font-medium',
          passed ? 'text-sage-400' : 'text-coral-400'
        )}>
          {passed ? 'Тема освоена!' : 'Нужно повторить'}
        </p>
        <p className="text-ink-400 text-sm mt-2">
          {result.answers.filter((a) => a.isCorrect).length} из {result.totalQuestions} правильно
        </p>

        {/* Coins earned */}
        <div className="flex items-center justify-center gap-2 mt-3 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5 w-fit mx-auto">
          <Coins size={14} className="text-amber-400" />
          <span className="text-amber-300 text-sm font-semibold">+{passed ? 20 : 5} монет</span>
        </div>

        {/* SRS cards added */}
        {srsAdded > 0 && (
          <div className="flex items-center justify-center gap-2 mt-3 bg-violet-400/10 border border-violet-400/20 rounded-full px-4 py-1.5 w-fit mx-auto">
            <Brain size={14} className="text-violet-400" />
            <span className="text-violet-300 text-sm font-medium">
              {srsAdded} {srsAdded === 1 ? 'карточка' : srsAdded < 5 ? 'карточки' : 'карточек'} добавлено в повторение
            </span>
          </div>
        )}
      </div>

      {/* Answers review */}
      <div className="flex-1">
        <h3 className="text-ink-400 text-xs font-medium uppercase tracking-wider mb-3">Разбор ответов</h3>
        <div className="space-y-3">
          {result.answers.map((answer, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border p-4',
                answer.isCorrect
                  ? 'bg-sage-500/5 border-sage-500/15'
                  : 'bg-coral-500/5 border-coral-500/15'
              )}
            >
              <div className="flex items-start gap-2 mb-2">
                {answer.isCorrect ? (
                  <CheckCircle2 size={16} className="text-sage-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={16} className="text-coral-400 shrink-0 mt-0.5" />
                )}
                <p className="text-ink-200 text-sm leading-snug">{answer.questionText}</p>
              </div>

              {!answer.isCorrect && (
                <div className="ml-6 mt-2 space-y-1.5">
                  <div className="bg-ink-800/30 rounded-lg px-3 py-2">
                    <p className="text-ink-400 text-xs">
                      <span className="text-coral-400 font-medium">Твой ответ:</span>{' '}
                      {resolveAnswer(answer.studentAnswer, answer.options)}
                    </p>
                  </div>
                  <div className="bg-ink-800/30 rounded-lg px-3 py-2">
                    <p className="text-ink-300 text-xs">
                      <span className="text-sage-400 font-medium">Правильный ответ:</span>{' '}
                      {resolveAnswer(answer.correctAnswer, answer.options)}
                    </p>
                  </div>
                  {answer.explanation && (
                    <div className="bg-ink-800/30 rounded-lg px-3 py-2">
                      <p className="text-ink-400 text-xs leading-relaxed">{answer.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {answer.aiComment && (
                <div className="ml-6 mt-2 flex items-start gap-2">
                  <MessageSquare size={12} className="text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-ink-400 text-xs leading-relaxed">{answer.aiComment}</p>
                </div>
              )}

              {answer.score > 0 && answer.score < 1 && (
                <div className="ml-6 mt-1">
                  <span className="text-amber-400 text-xs font-mono">
                    Частично верно: {Math.round(answer.score * 100)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-ink-800/50">
        <div className="flex gap-3">
          {!passed && topicId && (
            <Button
              variant="secondary"
              size="md"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => navigate(`/quiz/${topicId}`, { replace: true })}
            >
              <RotateCcw size={16} />
              Ещё раз
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => navigate('/')}
          >
            Продолжить
            <ArrowRight size={16} />
          </Button>
        </div>
        <div className="flex justify-center">
          <ShareButton
            filename={`chemprep-quiz-${percentage}`}
            cardProps={{
              variant: 'quiz',
              percentage,
              passed,
              totalQuestions: result.totalQuestions,
              correctCount: result.answers.filter((a) => a.isCorrect).length,
            }}
          />
        </div>
      </div>
    </div>
  )
}
