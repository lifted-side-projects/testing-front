import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDueCards, updateCardAfterReview, type SRSCard } from '@/lib/srs'
import { addCoins } from '@/lib/gamification'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Coins, Brain, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/Button'

export function ReviewPage() {
  const navigate = useNavigate()
  const cards = useMemo(() => getDueCards(), [])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const card = cards[currentIdx] as SRSCard | undefined
  const total = cards.length
  const progress = total > 0 ? ((currentIdx) / total) * 100 : 0

  function handleRate(quality: number) {
    if (!card) return
    updateCardAfterReview(card.id, quality)
    setReviewedCount((c) => c + 1)
    setFlipped(false)

    if (currentIdx + 1 >= total) {
      addCoins(10)
      setCompleted(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }

  if (total === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 page-enter">
        <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
          <CheckCircle2 size={36} className="text-violet-400" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink-100 mb-2">Все повторено!</h2>
        <p className="text-ink-500 text-sm text-center max-w-[260px] mb-6">
          Новые карточки появятся после прохождения тестов
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>На главную</Button>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 page-enter">
        <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
          <Brain size={36} className="text-violet-400" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink-100 mb-2">Сессия завершена!</h2>
        <p className="text-ink-400 text-sm text-center mb-4">
          Повторено {reviewedCount} {reviewedCount === 1 ? 'карточка' : 'карточек'}
        </p>
        <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-2 mb-6">
          <Coins size={16} className="text-amber-400" />
          <span className="text-amber-300 text-sm font-semibold">+10 монет</span>
        </div>
        <Button variant="primary" onClick={() => navigate('/')}>На главную</Button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col page-enter">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/')} className="text-ink-400">
            <X size={20} />
          </button>
          <span className="text-ink-400 text-sm font-mono">{currentIdx + 1}/{total}</span>
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
        <div
          className="w-full max-w-[360px] cursor-pointer"
          style={{ perspective: '1000px' }}
          onClick={() => !flipped && setFlipped(true)}
        >
          <AnimatePresence mode="wait">
            {!flipped ? (
              <motion.div
                key="front"
                initial={{ rotateY: 0 }}
                exit={{ rotateY: 90 }}
                transition={{ duration: 0.2 }}
                className="bg-ink-800/60 border border-ink-700/40 rounded-2xl p-6 min-h-[240px] flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-ink-200 text-base leading-relaxed mb-4">{card?.questionText}</p>
                <p className="text-ink-500 text-xs">Нажми, чтобы увидеть ответ</p>
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ rotateY: -90 }}
                animate={{ rotateY: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-6 min-h-[240px] flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-violet-300 text-base font-medium leading-relaxed mb-3">{card?.correctAnswer}</p>
                {card?.explanation && (
                  <p className="text-ink-400 text-sm leading-relaxed">{card.explanation}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div className="px-5 py-4 flex gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            className="flex-1 flex items-center justify-center gap-2 !border-coral-500/30 !text-coral-400"
            onClick={() => handleRate(1)}
          >
            <RotateCcw size={16} />
            Не помню
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => handleRate(4)}
          >
            <CheckCircle2 size={16} />
            Помню
          </Button>
        </div>
      )}
    </div>
  )
}
