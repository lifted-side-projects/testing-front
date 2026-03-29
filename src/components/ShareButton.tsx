import { useRef, useState, type ComponentProps } from 'react'
import { Button } from './Button'
import { ShareCard } from './ShareCard'
import { captureAndShare } from '@/lib/sharing'
import { Share2 } from 'lucide-react'

type ShareCardProps = ComponentProps<typeof ShareCard>

interface ShareButtonProps {
  cardProps: ShareCardProps
  filename: string
  label?: string
}

export function ShareButton({ cardProps, filename, label = 'Поделиться' }: ShareButtonProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleShare() {
    if (!cardRef.current) return
    setLoading(true)
    try {
      await captureAndShare(cardRef.current, filename)
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div aria-hidden style={{ position: 'fixed', left: 0, top: 0, width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
        <ShareCard ref={cardRef} {...cardProps} />
      </div>
      <Button
        variant="outline"
        size="sm"
        loading={loading}
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share2 size={14} />
        {label}
      </Button>
    </>
  )
}
