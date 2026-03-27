import { useState, useRef, useEffect, useCallback } from 'react'
import { useDiagnosticChat } from '@/lib/useDiagnosticChat'
import { MessageBubble } from '@/components/MessageBubble'
import { ChatSuggestions } from '@/components/ChatSuggestions'
import { Send, Loader2, Brain, ArrowRight, SkipForward } from 'lucide-react'
import { Button } from '@/components/Button'

interface DiagnosticChatProps {
  sessionId: string
  questionId: number
  studentAnswer?: unknown
  onComplete: () => void
}

export function DiagnosticChat({ sessionId, questionId, studentAnswer, onComplete }: DiagnosticChatProps) {
  const { messages, isStreaming, isDone, sendMessage, startChat, suggestions, suggestionsLoading } = useDiagnosticChat(sessionId, questionId, studentAnswer)
  const [input, setInput] = useState('')
  const [canSkip, setCanSkip] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const startedRef = useRef(false)

  // Auto-start: agent sends first message
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true
      startChat()
    }
  }, [startChat])

  // Allow skip after 15 seconds as a safety fallback
  useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 15_000)
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

  return (
    <div className="flex flex-col bg-ink-900/95 backdrop-blur-xl rounded-2xl border border-ink-700/40 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Compact header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ink-800/40">
        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
          <Brain size={12} className="text-violet-400" />
        </div>
        <span className="text-ink-400 text-xs">Репетитор — разбор ошибки</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 max-h-[60dvh] min-h-[100px]">
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center py-6">
            <p className="text-ink-500 text-xs">Репетитор сейчас задаст вопрос...</p>
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
          hasMessages={messages.length > 0}
          isStreaming={isStreaming}
          onSelect={sendMessage}
        />
      )}

      {/* Input or Continue button */}
      {isDone ? (
        <div className="px-4 pb-4 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2"
          >
            Продолжить
            <ArrowRight size={16} />
          </Button>
        </div>
      ) : canSkip && !isStreaming ? (
        <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Объясни свой ответ..."
              className="flex-1 bg-ink-800 text-ink-100 placeholder-ink-500 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-1 focus:ring-violet-500/50"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
          <button
            onClick={onComplete}
            className="flex items-center justify-center gap-1.5 text-ink-500 text-xs py-1.5 hover:text-ink-300 transition-colors"
          >
            <SkipForward size={12} />
            Пропустить разбор
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2 border-t border-ink-800/40">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Объясни свой ответ..."
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
      )}
    </div>
  )
}
