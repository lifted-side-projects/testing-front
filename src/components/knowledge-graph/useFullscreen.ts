import { useEffect } from 'react'

export function useFullscreen(fullscreen: boolean, onExit: () => void) {
  useEffect(() => {
    if (!fullscreen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onExit()
      }
    }

    function onPopState() {
      onExit()
    }

    // Push a dummy state so Android back button fires popstate
    window.history.pushState({ fullscreenGraph: true }, '')

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('popstate', onPopState)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('popstate', onPopState)
    }
  }, [fullscreen, onExit])
}
