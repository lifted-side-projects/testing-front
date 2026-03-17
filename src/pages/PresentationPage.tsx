import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Loader2, AlertCircle, Presentation,
} from 'lucide-react'

export function PresentationPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)

  const tid = Number(topicId)

  // Read-only: fetch existing presentation (no generation)
  const { data: status, isLoading, isError } = useQuery({
    queryKey: ['presentation', tid],
    queryFn: () => api.getPresentation(tid),
    retry: false,
  })

  const isDone = status?.status === 'done' && status.slides.length > 0

  // Swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide()
      else prevSlide()
    }
  }

  const nextSlide = useCallback(() => {
    if (status?.slides) {
      setCurrentSlide((i) => Math.min(status.slides.length - 1, i + 1))
    }
  }, [status])

  const prevSlide = useCallback(() => {
    setCurrentSlide((i) => Math.max(0, i - 1))
  }, [])

  // Keyboard
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide()
      if (e.key === 'ArrowLeft') prevSlide()
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [nextSlide, prevSlide])

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 page-enter">
        <Loader2 size={32} className="text-amber-400 animate-spin mb-4" />
        <p className="text-ink-400 text-sm">Загрузка...</p>
      </div>
    )
  }

  // Not found / not generated yet
  if (isError || !isDone) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 page-enter">
        <div className="w-20 h-20 rounded-3xl bg-ink-800/30 border border-ink-700/30 flex items-center justify-center mb-6">
          <Presentation size={32} className="text-ink-500" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink-200 mb-2 text-center">
          Презентация не готова
        </h2>
        <p className="text-ink-500 text-sm text-center max-w-[280px] mb-8">
          Контент по этой теме ещё не сгенерирован. Генерация происходит через админ-панель.
        </p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Назад</Button>
      </div>
    )
  }

  const slide = status.slides[currentSlide]
  const imageUrl = status.folderName
    ? api.getSlideImage(status.folderName, slide.slideNumber)
    : ''

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col bg-ink-950', fullscreen ? 'fixed inset-0 z-50' : 'min-h-dvh')}
    >
      {!fullscreen && (
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button onClick={() => navigate(-1)} className="text-ink-400 hover:text-ink-200">
            <ArrowLeft size={20} />
          </button>
          <span className="text-ink-400 text-sm font-mono">
            {currentSlide + 1} / {status.slides.length}
          </span>
          <button onClick={() => setFullscreen(true)} className="text-ink-400 hover:text-ink-200">
            <Maximize2 size={18} />
          </button>
        </div>
      )}

      <div
        className="flex-1 flex items-center justify-center px-2 relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-10 text-white/60 hover:text-white bg-black/30 rounded-full p-2"
          >
            <Minimize2 size={18} />
          </button>
        )}
        <div className="w-full max-w-[400px] aspect-video relative rounded-xl overflow-hidden bg-ink-900 shadow-2xl">
          {imageUrl && (
            <img src={imageUrl} alt={slide.title} className="w-full h-full object-contain fade-in" key={currentSlide} />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white/90 text-sm font-medium">{slide.title}</p>
            <p className="text-white/40 text-xs capitalize">{slide.type}</p>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 py-4">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {status.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn('h-1.5 rounded-full transition-all', i === currentSlide ? 'w-6 bg-amber-400' : 'w-1.5 bg-ink-700')}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" disabled={currentSlide === 0} onClick={prevSlide} className="flex-1 flex items-center justify-center gap-1">
            <ChevronLeft size={16} /> Назад
          </Button>
          {currentSlide < status.slides.length - 1 ? (
            <Button variant="primary" size="md" onClick={nextSlide} className="flex-1 flex items-center justify-center gap-1">
              Далее <ChevronRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={() => navigate(`/quiz/${topicId}`)} className="flex-1">
              Пройти тест
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {status.slides.map((s, i) => {
            const thumbUrl = status.folderName ? api.getSlideImage(status.folderName, s.slideNumber) : ''
            return (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn('w-16 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all', i === currentSlide ? 'border-amber-400 opacity-100' : 'border-transparent opacity-50')}
              >
                {thumbUrl && <img src={thumbUrl} alt="" className="w-full h-full object-cover" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
