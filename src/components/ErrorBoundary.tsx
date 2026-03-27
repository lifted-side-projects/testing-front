import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-ink-950">
          <div className="w-16 h-16 rounded-2xl bg-coral-500/10 border border-coral-500/20 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-coral-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink-100 mb-2">
            Что-то пошло не так
          </h2>
          <p className="text-ink-500 text-sm max-w-[280px] mb-6">
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </p>
          <Button variant="secondary" onClick={this.handleRetry} className="flex items-center gap-2">
            <RefreshCw size={16} />
            Попробовать снова
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
