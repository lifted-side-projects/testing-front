import { forwardRef } from 'react'

interface QuizShareCardProps {
  variant: 'quiz'
  percentage: number
  passed: boolean
  totalQuestions: number
  correctCount: number
}

interface ProfileShareCardProps {
  variant: 'profile'
  rankTitle: string
  rankIcon: string
  rankColor: string
  streak: number
  masteredPercent: number
}

type ShareCardProps = QuizShareCardProps | ProfileShareCardProps

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>((props, ref) => {
  const baseStyle: React.CSSProperties = {
    width: 360,
    height: 640,
    background: '#080b14',
    position: 'absolute',
    left: -9999,
    top: -9999,
    overflow: 'hidden',
    fontFamily: '"DM Sans", sans-serif',
  }

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 30% 20%, rgba(157, 78, 221, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(232, 185, 49, 0.1) 0%, transparent 50%)',
  }

  const brandStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#4a5272',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  }

  if (props.variant === 'quiz') {
    const accentColor = props.passed ? '#52b788' : '#e76f51'
    return (
      <div ref={ref} style={baseStyle}>
        <div style={overlayStyle} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40 }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: `${accentColor}15`, border: `3px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 48, color: accentColor, fontWeight: 800, fontFamily: '"Playfair Display", serif' }}>
              {props.percentage}%
            </span>
          </div>
          <p style={{ color: accentColor, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {props.passed ? 'Тема освоена!' : 'Тренируюсь дальше'}
          </p>
          <p style={{ color: '#7a8ba6', fontSize: 14, marginBottom: 32 }}>
            {props.correctCount} из {props.totalQuestions} правильно
          </p>
          <div style={{ width: 200, height: 6, borderRadius: 3, background: '#1a1f30', overflow: 'hidden' }}>
            <div style={{ width: `${props.percentage}%`, height: '100%', borderRadius: 3, background: accentColor }} />
          </div>
        </div>
        <p style={brandStyle}>ChemPrep</p>
      </div>
    )
  }

  // Profile variant
  return (
    <div ref={ref} style={baseStyle}>
      <div style={overlayStyle} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40 }}>
        <div style={{ width: 100, height: 100, borderRadius: 24, background: `${props.rankColor}15`, border: `3px solid ${props.rankColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 48 }}>
          {props.rankIcon}
        </div>
        <p style={{ color: props.rankColor, fontSize: 22, fontWeight: 700, fontFamily: '"Playfair Display", serif', marginBottom: 4 }}>
          {props.rankTitle}
        </p>
        <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#e76f51', fontSize: 28, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace' }}>{props.streak}</p>
            <p style={{ color: '#7a8ba6', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>дней подряд</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#52b788', fontSize: 28, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace' }}>{props.masteredPercent}%</p>
            <p style={{ color: '#7a8ba6', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>изучено</p>
          </div>
        </div>
      </div>
      <p style={brandStyle}>ChemPrep</p>
    </div>
  )
})

ShareCard.displayName = 'ShareCard'
