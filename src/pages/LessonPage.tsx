import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/Button'
import { ArrowLeft, Presentation, CheckCheck, BookOpen, AlertCircle, MessageCircle, Layers, Atom } from 'lucide-react'

export function LessonPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const tid = Number(topicId)

  // Check if presentation exists for this topic
  const { data: presData, isLoading: presLoading } = useQuery({
    queryKey: ['presentation', tid],
    queryFn: () => api.getPresentation(tid),
    retry: false,
  })

  // Check if flashcards exist
  const { data: flashcardDeck } = useQuery({
    queryKey: ['flashcard-deck', tid],
    queryFn: () => api.getFlashcardDeck(tid),
    retry: false,
  })

  const hasFlashcards = !!flashcardDeck && flashcardDeck.cardCount > 0

  const hasPresentation = !!presData && presData.presentations.length > 0
  const totalSlides = hasPresentation
    ? presData.presentations.reduce((max, p) => Math.max(max, p.totalSlides), 0)
    : 0

  return (
    <div className="min-h-dvh flex flex-col page-enter">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-ink-950/95 backdrop-blur-xl border-b border-ink-800/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-base font-semibold text-ink-100 truncate flex-1">
            Тема {topicId}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        {/* Topic info */}
        {presData && (
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-ink-50 mb-1">
              {presData.topicTitle || `Тема ${topicId}`}
            </h2>
            {presData.grade && (
              <p className="text-ink-400 text-sm">{presData.grade} класс</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Presentation */}
          {hasPresentation ? (
            <button
              onClick={() => navigate(`/presentation/${topicId}`)}
              className="w-full flex items-center gap-4 bg-gradient-to-r from-amber-400/10 to-amber-400/5 border border-amber-400/20 rounded-2xl p-4 active:scale-[0.98] transition-transform text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
                <Presentation size={22} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-ink-100 text-sm font-semibold">Презентация</p>
                <p className="text-ink-400 text-xs mt-0.5">{totalSlides} слайдов</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-ink-800/30 border border-ink-700/20 rounded-2xl p-4 opacity-60">
              <div className="w-12 h-12 rounded-xl bg-ink-700/30 flex items-center justify-center shrink-0">
                <Presentation size={22} className="text-ink-500" />
              </div>
              <div className="flex-1">
                <p className="text-ink-400 text-sm font-medium">Презентация</p>
                <p className="text-ink-600 text-xs mt-0.5">Ещё не создана</p>
              </div>
            </div>
          )}

          {/* Quiz */}
          <button
            onClick={() => navigate(`/quiz/${topicId}`)}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-sage-500/10 to-sage-500/5 border border-sage-500/20 rounded-2xl p-4 active:scale-[0.98] transition-transform text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-sage-500/20 flex items-center justify-center shrink-0">
              <CheckCheck size={22} className="text-sage-400" />
            </div>
            <div className="flex-1">
              <p className="text-ink-100 text-sm font-semibold">Пройти тест</p>
              <p className="text-ink-400 text-xs mt-0.5">8 вопросов, AI-проверка</p>
            </div>
          </button>

          {/* Flashcards */}
          {hasFlashcards && (
            <button
              onClick={() => navigate(`/flashcards/${topicId}`)}
              className="w-full flex items-center gap-4 bg-gradient-to-r from-coral-500/10 to-coral-500/5 border border-coral-500/20 rounded-2xl p-4 active:scale-[0.98] transition-transform text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-coral-500/20 flex items-center justify-center shrink-0">
                <Layers size={22} className="text-coral-400" />
              </div>
              <div className="flex-1">
                <p className="text-ink-100 text-sm font-semibold">Карточки</p>
                <p className="text-ink-400 text-xs mt-0.5">{flashcardDeck!.cardCount} карточек для повторения</p>
              </div>
            </button>
          )}

          {/* Chat with tutor */}
          <button
            onClick={() => navigate(`/chat/${topicId}`)}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded-2xl p-4 active:scale-[0.98] transition-transform text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
              <MessageCircle size={22} className="text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-ink-100 text-sm font-semibold">Спросить репетитора</p>
              <p className="text-ink-400 text-xs mt-0.5">AI-чат по теме урока</p>
            </div>
          </button>

          {/* Periodic table */}
          <button
            onClick={() => navigate('/periodic-table')}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-coral-500/10 to-coral-500/5 border border-coral-500/20 rounded-2xl p-4 active:scale-[0.98] transition-transform text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-coral-500/20 flex items-center justify-center shrink-0">
              <Atom size={22} className="text-coral-400" />
            </div>
            <div className="flex-1">
              <p className="text-ink-100 text-sm font-semibold">Таблица Менделеева</p>
              <p className="text-ink-400 text-xs mt-0.5">Интерактивная таблица</p>
            </div>
          </button>
        </div>

        {/* Empty state hint */}
        {!presLoading && !hasPresentation && (
          <div className="mt-8 flex items-start gap-3 bg-ink-800/20 border border-ink-700/15 rounded-xl p-4">
            <AlertCircle size={16} className="text-ink-500 shrink-0 mt-0.5" />
            <p className="text-ink-500 text-xs leading-relaxed">
              Контент по этой теме генерируется через админ-панель. Пока можешь пройти тест — AI создаст вопросы по учебнику.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
