import { useState, useCallback, useRef } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { ChatMessage } from './useChat'

export function useQuizErrorChat(sessionId: string, questionId?: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [suggestionsKey, setSuggestionsKey] = useState(0)
  const messagesForSuggestions = useRef<ChatMessage[]>([])

  const queryClient = useQueryClient()

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['quiz-error-suggestions', sessionId, questionId, suggestionsKey],
    queryFn: () => api.quizErrorChatSuggestions(sessionId, messagesForSuggestions.current, questionId),
    staleTime: Infinity,
    retry: false,
  })

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    queryClient.setQueryData(['quiz-error-suggestions', sessionId, questionId, suggestionsKey], [])
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setIsStreaming(true)

    let finalMessages: ChatMessage[] = []

    try {
      const stream = await api.quizErrorChatStream(sessionId, text.trim(), questionId)
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk }
          }
          finalMessages = updated
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = { ...last, content: 'Ошибка при получении ответа. Попробуй ещё раз.' }
        }
        finalMessages = updated
        return updated
      })
    } finally {
      setIsStreaming(false)
      messagesForSuggestions.current = finalMessages
      setSuggestionsKey(k => k + 1)
    }
  }, [sessionId, questionId, isStreaming, queryClient, suggestionsKey])

  return { messages, isStreaming, sendMessage, suggestions, suggestionsLoading }
}
