import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDiagnosticChat } from '@/lib/useDiagnosticChat'
import { MessageBubble } from '@/components/MessageBubble'
import { ChatSuggestions } from '@/components/ChatSuggestions'
import { Send, Loader2, Search, Brain, ArrowRight, X as XIcon, SkipForward } from 'lucide-react'
import { Button } from '@/components/Button'

interface DiagnosticChatProps {
  sessionId: string
  questionId: number
  studentAnswer?: unknown
  onComplete: () => void
  // New overlay props
  correctAnswer?: unknown
  questionText?: string
  questionType?: string
  options?: Record<string, string>[]
  onClose?: () => void
}

function formatAnswer(
  answer: unknown,
  questionType?: string,
  options?: Record<string, string>[],
): string {
  if (answer === null || answer === undefined) return '—'

  if (questionType === 'single_choice' && options) {
    const key = (answer as string).toLowerCase()
    const opt = options.find(o => Object.keys(o)[0].toLowerCase() === key)
    if (opt) {
      const k = Object.keys(opt)[0]
      return `${k.toUpperCase()}) ${opt[k]}`
    }
    return String(answer)
  }

  if (questionType === 'multiple_choice' && options) {
    const keys = (answer as string[]).map(s => s.toLowerCase())
    return keys
      .map(key => {
        const opt = options.find(o => Object.keys(o)[0].toLowerCase() === key)
        if (opt) {
          const k = Object.keys(opt)[0]
          return `${k.toUpperCase()}) ${opt[k]}`
        }
        return key.toUpperCase()
      })
      .join(', ')
  }

  if (questionType === 'matching') {
    const pairs = answer as Record<string, string>
    return Object.entries(pairs)
      .map(([k, v]) => `${k} → ${v}`)
      .join('; ')
  }

  return String(answer)
}

export function DiagnosticChat({
  sessionId,
  questionId,
  studentAnswer,
  onComplete,
  correctAnswer,
  questionText,
  questionType,
  options,
  onClose,
}: DiagnosticChatProps) {
  const { messages, isStreaming, isDone, sendMessage, startChat, suggestions, suggestionsLoading } =
    useDiagnosticChat(sessionId, questionId, studentAnswer)
  const [input, setInput] = useState('')
  const [canSkip, setCanSkip] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const startedRef = useRef(false)

  // Overlay mode when used with answer context (diagnostic review) or explicit onClose
  const isOverlay = correctAnswer !== undefined || questionText !== undefined || !!onClose

  // Auto-start: agent sends first message
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true
      startChat()
    }
  }, [startChat])

  // Safety fallback: allow skip after 15s in case of agent error
  useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 5_000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (!isStreaming) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isStreaming])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage(input)
    setInput('')
  }

  function handleClose() {
    if (onClose) onClose()
    onComplete()
  }

  const chatContent = (
    <>
      {/* Messages */}
      <div
        ref={scrollRef}
        className={
          isOverlay
            ? 'flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0'
            : 'flex-1 overflow-y-auto px-4 py-3 space-y-4 max-h-[60dvh] min-h-[100px]'
        }
      >
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center py-6">
            <p className="text-ink-500 text-xs">Репетитор анализирует ответ...</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            isLast={i === messages.length - 1 && msg.role === 'assistant'}
            isStreaming={isStreaming}
          />
        ))}
      </div>

      {/* Suggestions */}
      {!isDone && (
        <ChatSuggestions
          suggestions={suggestions}
          isLoading={suggestionsLoading}
          hasMessages={messages.some(m => m.role === 'user')}
          isStreaming={isStreaming}
          onSelect={sendMessage}
          initialSuggestions={['Я угадал', 'Я перепутал темы', 'Не помню эту тему']}
        />
      )}

      {/* Input or Continue button */}
      {isDone ? (
        <div className="px-4 pb-4 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2"
          >
            Следующий вопрос
            <ArrowRight size={16} />
          </Button>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2 border-t border-ink-800/40 space-y-2">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Напиши свой ответ..."
                className="flex-1 bg-ink-800 text-ink-100 placeholder-ink-500 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-1 focus:ring-violet-500/50"
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shrink-0"
              >
                {isStreaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </form>
          {canSkip && !isStreaming && (
            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-1.5 text-ink-500 text-xs py-1.5 hover:text-ink-300 transition-colors"
            >
              <SkipForward size={12} />
              Пропустить
            </button>
          )}
        </div>
      )}
    </>
  )

  // Overlay mode — fullscreen with context card
  if (isOverlay) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-md"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Search size={12} className="text-violet-400" />
            </div>
            <span className="text-ink-300 text-xs font-medium">Ищем пробел</span>
          </div>
          {onClose && (
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-ink-800/60 flex items-center justify-center text-ink-400 active:scale-95 transition-transform"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>

        {/* Context hint */}
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-violet-500/8 border border-violet-500/15">
          <p className="text-violet-300/80 text-[11px] leading-relaxed">
            Репетитор задаст пару вопросов, чтобы понять, где именно пробел. Отвечай честно.
          </p>
        </div>

        {chatContent}
      </motion.div>
    )
  }

  // Inline mode (legacy fallback, not used in diagnostic anymore)
  return (
    <div className="flex flex-col bg-ink-900/95 backdrop-blur-xl rounded-2xl border border-ink-700/40 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ink-800/40">
        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
          <Brain size={12} className="text-violet-400" />
        </div>
        <span className="text-ink-400 text-xs">Репетитор — поиск пробела</span>
      </div>
      {chatContent}
    </div>
  )
}
