import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Flashcard } from '@/lib/api'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'
import { ArrowLeft, RotateCcw, Loader2, Layers, CheckCircle2 } from 'lucide-react'

const QUALITY_BUTTONS = [
  { quality: 0, label: 'Забыл', color: 'bg-coral-500', textColor: 'text-coral-400' },
  { quality: 2, label: 'Трудно', color: 'bg-amber-500', textColor: 'text-amber-400' },
  { quality: 4, label: 'Хорошо', color: 'bg-sage-500', textColor: 'text-sage-400' },
  { quality: 5, label: 'Легко', color: 'bg-violet-500', textColor: 'text-violet-400' },
]

export function FlashcardPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const tid = Number(topicId)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const { data: cards = [], isLoading, isError } = useQuery({
    queryKey: ['flashcards-review', tid],
    queryFn: () => api.getFlashcardsForReview(tid),
    retry: false,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ flashcardId, quality }: { flashcardId: number; quality: number }) =>
      api.recordFlashcardReview(flashcardId, quality),
    onSuccess: () => {
      setReviewedCount(c => c + 1)
      setFlipped(false)
      if (currentIdx < cards.length - 1) {
        setCurrentIdx(i => i + 1)
      } else {
        setCurrentIdx(-1) // done
      }
      queryClient.invalidateQueries({ queryKey: ['flashcard-stats', tid] })
    },
  })

  const card = currentIdx >= 0 ? cards[currentIdx] : null
  const isDone = currentIdx === -1 || (cards.length > 0 && currentIdx >= cards.length)

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 page-enter">
        <Loader2 size={32} className="text-violet-400 animate-spin" />
        <p className="text-ink-400 text-sm">Загрузка карточек...</p>
      </div>
    )
  }

  if (isError || cards.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 page-enter">
        <div className="w-20 h-20 rounded-3xl bg-ink-800/30 border border-ink-700/30 flex items-center justify-center mb-6">
          <Layers size={32} className="text-ink-500" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink-200 mb-2 text-center">
          Нет карточек для повторения
        </h2>
        <p className="text-ink-500 text-sm text-center max-w-[280px] mb-8">
          {isError ? 'Флеш-карточки по этой теме ещё не созданы' : 'Все карточки повторены! Возвращайся позже.'}
        </p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Назад</Button>
      </div>
    )
  }

  // Done screen
  if (isDone) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 page-enter">
        <div className="w-24 h-24 rounded-full bg-sage-500/15 border-2 border-sage-500/30 flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-sage-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-100 mb-2">Отлично!</h2>
        <p className="text-ink-400 text-sm text-center mb-2">
          {reviewedCount} {reviewedCount === 1 ? 'карточка' : 'карточек'} повторено
        </p>
        <p className="text-ink-500 text-xs text-center max-w-[260px] mb-8">
          Следующее повторение будет запланировано автоматически
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => {
            setCurrentIdx(0)
            setFlipped(false)
            setReviewedCount(0)
            queryClient.invalidateQueries({ queryKey: ['flashcards-review', tid] })
          }}>
            <RotateCcw size={16} className="mr-1" />
            Ещё раз
          </Button>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Продолжить
          </Button>
        </div>
      </div>
    )
  }

  if (!card) return null

  const progress = cards.length > 0 ? ((currentIdx + 1) / cards.length) * 100 : 0

  return (
    <div className="min-h-dvh flex flex-col page-enter">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="text-ink-400">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-violet-400" />
            <span className="text-ink-300 text-sm font-medium">Карточки</span>
          </div>
          <span className="text-ink-400 text-sm font-mono">
            {currentIdx + 1}/{cards.length}
          </span>
        </div>
        <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-5 py-6">
        <button
          onClick={() => setFlipped(!flipped)}
          className="w-full max-w-sm aspect-[3/4] perspective-1000"
        >
          <div className={cn(
            'relative w-full h-full transition-transform duration-500 preserve-3d',
            flipped ? 'rotate-y-180' : '',
          )}>
            {/* Front */}
            <div className="absolute inset-0 backface-hidden rounded-3xl border-2 border-ink-700/40 bg-gradient-to-br from-ink-800/80 to-ink-800/40 flex flex-col items-center justify-center p-8">
              <span className={cn(
                'text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-md mb-6',
                card.cardType === 'formula' ? 'bg-amber-400/15 text-amber-400' :
                card.cardType === 'reaction' ? 'bg-coral-500/15 text-coral-400' :
                card.cardType === 'definition' ? 'bg-sage-500/15 text-sage-400' :
                'bg-violet-500/15 text-violet-400'
              )}>
                {card.cardType === 'formula' ? 'Формула' :
                 card.cardType === 'reaction' ? 'Реакция' :
                 card.cardType === 'definition' ? 'Определение' : 'Концепция'}
              </span>
              <p className="text-ink-100 text-lg text-center leading-relaxed font-medium">
                {card.front}
              </p>
              <p className="text-ink-600 text-xs mt-6">Нажми, чтобы перевернуть</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-ink-800/60 flex flex-col items-center justify-center p-8">
              <p className="text-ink-100 text-base text-center leading-relaxed">
                {card.back}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Quality buttons (visible only when flipped) */}
      <div className={cn(
        'px-5 pb-6 transition-all duration-300',
        flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}>
        <p className="text-ink-500 text-xs text-center mb-3">Насколько хорошо ты запомнил?</p>
        <div className="grid grid-cols-4 gap-2">
          {QUALITY_BUTTONS.map(({ quality, label, color, textColor }) => (
            <button
              key={quality}
              onClick={() => reviewMutation.mutate({ flashcardId: card.id, quality })}
              disabled={reviewMutation.isPending}
              className={cn(
                'rounded-xl py-3 text-center transition-all active:scale-95',
                `bg-ink-800/60 border border-ink-700/40`,
                reviewMutation.isPending && 'opacity-50'
              )}
            >
              <span className={cn('text-xs font-medium', textColor)}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
