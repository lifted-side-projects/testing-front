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
  userName: string
  rankTitle: string
  rankIcon: string
  rankColor: string
  streak: number
  coins: number
  masteredPercent: number
}

type ShareCardProps = QuizShareCardProps | ProfileShareCardProps

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>((props, ref) => {
  const baseStyle: React.CSSProperties = {
    width: 360,
    height: 640,
    background: '#080b14',
    overflow: 'hidden',
    fontFamily: '"DM Sans", sans-serif',
    position: 'relative',
  }

  if (props.variant === 'quiz') {
    const accentColor = props.passed ? '#52b788' : '#e76f51'
    return (
      <div ref={ref} style={baseStyle}>
        {/* Background glow */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 30%, ${accentColor}18 0%, transparent 60%)` }} />
        {/* Top decorative line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40 }}>
          {/* Logo */}
          <p style={{ color: '#4a5272', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' as const, marginBottom: 32 }}>ChemPrep</p>

          {/* Score circle */}
          <div style={{ width: 130, height: 130, borderRadius: '50%', background: `${accentColor}10`, border: `3px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <span style={{ fontSize: 48, color: accentColor, fontWeight: 800, fontFamily: '"Playfair Display", serif' }}>
              {props.percentage}%
            </span>
          </div>

          {/* Status */}
          <p style={{ color: accentColor, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {props.passed ? 'Тема освоена!' : 'Тренируюсь дальше'}
          </p>
          <p style={{ color: '#7a8ba6', fontSize: 14, marginBottom: 32 }}>
            {props.correctCount} из {props.totalQuestions} правильно
          </p>

          {/* Progress bar */}
          <div style={{ width: 220, height: 6, borderRadius: 3, background: '#1a1f30', overflow: 'hidden' }}>
            <div style={{ width: `${props.percentage}%`, height: '100%', borderRadius: 3, background: accentColor }} />
          </div>
        </div>

        {/* Bottom decorative */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />
      </div>
    )
  }

  // Profile variant
  const { rankColor, rankIcon, rankTitle, userName, streak, coins, masteredPercent } = props

  return (
    <div ref={ref} style={baseStyle}>
      {/* Background glows */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 15%, ${rankColor}20 0%, transparent 50%), radial-gradient(ellipse at 70% 85%, #e8b93110 0%, transparent 50%)` }} />
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${rankColor}, transparent)` }} />
      {/* Subtle grid pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', padding: '36px 32px 28px' }}>
        {/* Logo */}
        <p style={{ color: '#4a5272', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' as const, marginBottom: 40 }}>ChemPrep</p>

        {/* Rank icon */}
        <div style={{
          width: 96, height: 96, borderRadius: 28,
          background: `${rankColor}12`,
          border: `2px solid ${rankColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, fontSize: 48,
          boxShadow: `0 0 40px ${rankColor}15`,
        }}>
          {rankIcon}
        </div>

        {/* Rank title */}
        <p style={{ color: rankColor, fontSize: 20, fontWeight: 700, fontFamily: '"Playfair Display", serif', marginBottom: 6 }}>
          {rankTitle}
        </p>

        {/* User name */}
        <p style={{ color: '#c0c8e0', fontSize: 15, fontWeight: 500, marginBottom: 28 }}>
          {userName}
        </p>

        {/* Progress bar */}
        <div style={{ width: '100%', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#7a8ba6', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Прогресс</span>
            <span style={{ color: '#c0c8e0', fontSize: 12, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>{masteredPercent}%</span>
          </div>
          <div style={{ width: '100%', height: 8, borderRadius: 4, background: '#1a1f30', overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(2, masteredPercent)}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${rankColor}cc, ${rankColor})` }} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 12, width: '100%',
        }}>
          {/* Streak */}
          <div style={{
            flex: 1, textAlign: 'center', padding: '14px 8px',
            background: '#e76f5108', border: '1px solid #e76f5118',
            borderRadius: 16,
          }}>
            <p style={{ fontSize: 10, marginBottom: 6 }}>🔥</p>
            <p style={{ color: '#e76f51', fontSize: 24, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>{streak}</p>
            <p style={{ color: '#7a8ba6', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 1, marginTop: 4 }}>стрик</p>
          </div>
          {/* Mastered */}
          <div style={{
            flex: 1, textAlign: 'center', padding: '14px 8px',
            background: '#52b78808', border: '1px solid #52b78818',
            borderRadius: 16,
          }}>
            <p style={{ fontSize: 10, marginBottom: 6 }}>📚</p>
            <p style={{ color: '#52b788', fontSize: 24, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>{masteredPercent}%</p>
            <p style={{ color: '#7a8ba6', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 1, marginTop: 4 }}>изучено</p>
          </div>
          {/* Coins */}
          <div style={{
            flex: 1, textAlign: 'center', padding: '14px 8px',
            background: '#e8b93108', border: '1px solid #e8b93118',
            borderRadius: 16,
          }}>
            <p style={{ fontSize: 10, marginBottom: 6 }}>🪙</p>
            <p style={{ color: '#e8b931', fontSize: 24, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>{coins}</p>
            <p style={{ color: '#7a8ba6', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 1, marginTop: 4 }}>монеты</p>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <p style={{ color: '#323a52', fontSize: 11, letterSpacing: 1 }}>
          Готовлюсь к ЕНТ по химии
        </p>
      </div>

      {/* Bottom accent bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${rankColor}60, transparent)` }} />
    </div>
  )
})

ShareCard.displayName = 'ShareCard'
