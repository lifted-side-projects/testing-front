import { Lightbulb } from 'lucide-react'

interface ChatSuggestionsProps {
  suggestions: string[]
  isLoading: boolean
  hasMessages: boolean
  isStreaming: boolean
  onSelect: (text: string) => void
}

export function ChatSuggestions({ suggestions, isLoading, hasMessages, isStreaming, onSelect }: ChatSuggestionsProps) {
  if (isStreaming) return null
  if (!isLoading && suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {!hasMessages && (
        <div className="flex items-center gap-1.5 w-full mb-1">
          <Lightbulb size={13} className="text-amber-400/70" />
          <span className="text-[11px] text-ink-500">Попробуй спросить</span>
        </div>
      )}
      {isLoading ? (
        <>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-[30px] rounded-full border border-ink-700/40 bg-ink-800/30 animate-pulse"
              style={{ width: `${80 + i * 24}px` }}
            />
          ))}
        </>
      ) : (
        suggestions.map(text => (
          <button
            key={text}
            onClick={() => onSelect(text)}
            className="text-xs px-3 py-1.5 rounded-full border border-ink-700/60 bg-ink-800/50 text-ink-300 hover:text-ink-100 hover:border-violet-500/40 hover:bg-violet-500/10 active:scale-95 transition-all"
          >
            {text}
          </button>
        ))
      )}
    </div>
  )
}
