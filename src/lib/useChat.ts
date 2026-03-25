import { useState, useCallback, useRef } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from './api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function useChat(topicId: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  // Track messages snapshot for suggestions query key
  const [suggestionsKey, setSuggestionsKey] = useState(0)
  const messagesForSuggestions = useRef<ChatMessage[]>([])

  const queryClient = useQueryClient()

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['chat-suggestions', topicId, suggestionsKey],
    queryFn: () => api.chatSuggestions(topicId, messagesForSuggestions.current),
    staleTime: Infinity,
    retry: false,
  })

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    // Clear suggestions while streaming
    queryClient.setQueryData(['chat-suggestions', topicId, suggestionsKey], [])
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setIsStreaming(true)

    let finalMessages: ChatMessage[] = []

    try {
      const stream = await api.chatStream(topicId, text.trim())
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
    } catch (err) {
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
      // Trigger new suggestions fetch with updated messages
      messagesForSuggestions.current = finalMessages
      setSuggestionsKey(k => k + 1)
    }
  }, [topicId, isStreaming, queryClient, suggestionsKey])

  const clearMessages = useCallback(() => {
    setMessages([])
    messagesForSuggestions.current = []
    setSuggestionsKey(k => k + 1)
  }, [])

  return { messages, isStreaming, sendMessage, clearMessages, suggestions, suggestionsLoading }
}
