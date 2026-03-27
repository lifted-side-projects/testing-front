import { useState, useCallback, useRef } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from './api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const DONE_MARKER = '__DIAGNOSTIC_CHAT_DONE__'

export function useDiagnosticChat(sessionId: string, questionId: number, studentAnswer?: unknown) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const historyRef = useRef<ChatMessage[]>([])
  const studentAnswerRef = useRef(studentAnswer)

  // Suggestions via React Query (same pattern as useChat)
  const [suggestionsKey, setSuggestionsKey] = useState(0)
  const suggestionsKeyRef = useRef(suggestionsKey)
  suggestionsKeyRef.current = suggestionsKey
  const messagesForSuggestions = useRef<ChatMessage[]>([])
  const queryClient = useQueryClient()

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['diagnostic-suggestions', sessionId, questionId, suggestionsKey],
    queryFn: () => api.diagnosticChatSuggestions(sessionId, questionId, studentAnswerRef.current, messagesForSuggestions.current),
    staleTime: Infinity,
    retry: false,
  })

  const streamResponse = useCallback(async (userText: string | null) => {
    if (isStreaming || isDone) return

    // If userText is provided, add it to history
    if (userText) {
      const userMsg: ChatMessage = { role: 'user', content: userText }
      historyRef.current = [...historyRef.current, userMsg]
    }

    // Clear suggestions while streaming (use ref for current key)
    queryClient.setQueryData(['diagnostic-suggestions', sessionId, questionId, suggestionsKeyRef.current], [])

    setMessages([...historyRef.current, { role: 'assistant', content: '' }])
    setIsStreaming(true)

    let fullResponse = ''

    // The message to send — for initial greeting, send a trigger phrase
    const messageToSend = userText || '__START__'
    const history = historyRef.current
      .filter(m => m.role !== 'assistant' || m.content)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const stream = await api.diagnosticChatStream(sessionId, questionId, messageToSend, history, studentAnswerRef.current)
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk

        // Check for done marker in accumulated response
        const displayContent = fullResponse.replace(DONE_MARKER, '').trim()

        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: displayContent }
          }
          return updated
        })
      }

      // Check if chat is done
      const chatDone = fullResponse.includes(DONE_MARKER)
      if (chatDone) {
        setIsDone(true)
      }

      // Update history with final assistant message
      const cleanContent = fullResponse.replace(DONE_MARKER, '').trim()
      historyRef.current = [...historyRef.current, { role: 'assistant', content: cleanContent }]
      setMessages(historyRef.current)

      // Trigger new suggestions fetch (only if chat is not done)
      if (!chatDone) {
        messagesForSuggestions.current = historyRef.current
        setSuggestionsKey(k => k + 1)
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = { ...last, content: 'Ошибка соединения. Попробуй ещё раз.' }
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }, [sessionId, questionId, isStreaming, isDone, queryClient])

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return
    streamResponse(text.trim())
  }, [streamResponse])

  // Start chat — agent sends the first message without user input
  const startChat = useCallback(() => {
    streamResponse(null)
  }, [streamResponse])

  const reset = useCallback(() => {
    setMessages([])
    setIsStreaming(false)
    setIsDone(false)
    historyRef.current = []
    messagesForSuggestions.current = []
    setSuggestionsKey(0)
  }, [])

  return { messages, isStreaming, isDone, sendMessage, startChat, reset, suggestions, suggestionsLoading }
}
