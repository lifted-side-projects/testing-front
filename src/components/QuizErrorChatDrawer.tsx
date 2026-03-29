import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useQuizErrorChat } from '@/lib/useQuizErrorChat'
import { MessageBubble } from '@/components/MessageBubble'
import { ChatSuggestions } from '@/components/ChatSuggestions'
import { X, Send, Loader2, Brain } from 'lucide-react'

interface QuizErrorChatDrawerProps {
  sessionId: string
  questionId?: number
  open: boolean
  onClose: () => void
}

export function QuizErrorChatDrawer({ sessionId, questionId, open, onClose }: QuizErrorChatDrawerProps) {
  const { messages, isStreaming, sendMessage, suggestions, suggestionsLoading } = useQuizErrorChat(sessionId, questionId)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage(input)
    setInput('')
  }

  function handleSuggestion(text: string) {
    if (isStreaming) return
    sendMessage(text)
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/60 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex flex-col bg-ink-900 rounded-t-3xl transition-transform duration-300 ease-out',
          'h-[75dvh] max-h-[600px]',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="shrink-0 pt-3 pb-2 px-4">
          <div className="w-10 h-1 rounded-full bg-ink-700 mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-coral-500/20 flex items-center justify-center">
                <Brain size={16} className="text-coral-400" />
              </div>
              <span className="text-ink-100 font-semibold text-sm">Разбор ошибок</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-ink-800 flex items-center justify-center text-ink-400 hover:text-ink-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-coral-500/10 border border-coral-500/20 flex items-center justify-center mb-4">
                <Brain size={24} className="text-coral-400" />
              </div>
              <p className="text-ink-300 text-sm font-medium mb-1">Разберём ошибки</p>
              <p className="text-ink-500 text-xs">Репетитор объяснит, почему ответ был неправильным</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} isLast={i === messages.length - 1 && msg.role === 'assistant'} isStreaming={isStreaming} />
          ))}
        </div>

        <ChatSuggestions
          suggestions={suggestions}
          isLoading={suggestionsLoading}
          hasMessages={messages.length > 0}
          isStreaming={isStreaming}
          onSelect={handleSuggestion}
        />

        <form onSubmit={handleSubmit} className="shrink-0 px-4 pb-4 pt-2 border-t border-ink-800/50">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Спроси про ошибку..."
              className="flex-1 bg-ink-800 text-ink-100 placeholder-ink-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-coral-500/50"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="w-10 h-10 rounded-xl bg-coral-500 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shrink-0"
            >
              {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
