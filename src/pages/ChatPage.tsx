import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChat } from '@/lib/useChat'
import { MessageBubble } from '@/components/MessageBubble'
import { ChatSuggestions } from '@/components/ChatSuggestions'
import { ArrowLeft, Send, Loader2, MessageCircle } from 'lucide-react'

export function ChatPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const tid = Number(topicId)
  const { messages, isStreaming, sendMessage, suggestions, suggestionsLoading } = useChat(tid)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

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
    <div className="min-h-dvh flex flex-col bg-ink-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-ink-950/95 backdrop-blur-xl border-b border-ink-800/50 shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <MessageCircle size={16} className="text-violet-400" />
          </div>
          <h1 className="font-display text-base font-semibold text-ink-100 truncate flex-1">
            Репетитор
          </h1>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-violet-400" />
            </div>
            <p className="text-ink-300 text-sm font-medium mb-1">Спроси что угодно</p>
            <p className="text-ink-500 text-xs">Репетитор объяснит тему, используя учебник</p>
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
      <ChatSuggestions
        suggestions={suggestions}
        isLoading={suggestionsLoading}
        hasMessages={messages.length > 0}
        isStreaming={isStreaming}
        onSelect={handleSuggestion}
      />

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 px-4 pb-4 pt-2 border-t border-ink-800/50">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Задай вопрос..."
            className="flex-1 bg-ink-800 text-ink-100 placeholder-ink-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-violet-500/50"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shrink-0"
          >
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </form>
    </div>
  )
}
