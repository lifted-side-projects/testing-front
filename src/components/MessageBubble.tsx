import Markdown from 'react-markdown'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/lib/useChat'

interface MessageBubbleProps {
  message: ChatMessage
  isLast: boolean
  isStreaming: boolean
}

export function MessageBubble({ message, isLast, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-amber-400/15 text-ink-100 rounded-br-md'
            : 'bg-ink-800 text-ink-200 rounded-bl-md',
        )}
      >
        {message.content ? (
          <>
            {isUser ? (
              message.content
            ) : (
              <div className="prose-chat"><Markdown>{message.content}</Markdown></div>
            )}
            {isLast && isStreaming && (
              <span className="inline-block w-1 h-4 ml-0.5 bg-violet-400 animate-pulse align-middle" />
            )}
          </>
        ) : (
          isLast && isStreaming && (
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )
        )}
      </div>
    </div>
  )
}
