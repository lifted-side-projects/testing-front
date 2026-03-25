import Markdown from 'react-markdown'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/lib/useChat'
import { Brain } from 'lucide-react'

interface MessageBubbleProps {
  message: ChatMessage
  isLast: boolean
  isStreaming: boolean
}

export function MessageBubble({ message, isLast, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-amber-400/15 text-ink-100 px-3.5 py-2.5 text-[13px] leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  // Assistant message — with avatar
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Brain size={12} className="text-violet-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-[1.7] text-ink-300">
          {message.content ? (
            <>
              <div className="prose-chat"><Markdown>{message.content}</Markdown></div>
              {isLast && isStreaming && (
                <span className="inline-block w-1 h-3.5 ml-0.5 bg-violet-400 animate-pulse align-middle" />
              )}
            </>
          ) : (
            isLast && isStreaming && (
              <span className="inline-flex gap-1 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )
          )}
        </div>
      </div>
    </div>
  )
}
