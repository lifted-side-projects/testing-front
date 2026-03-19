import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setOnboarded, getUser, setAuth, getToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/Button'
import { Gamepad2, Tv, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const interests = [
  {
    id: 'anime',
    label: 'Аниме',
    description: 'Наруто, Тетрадь Смерти, Атака Титанов...',
    icon: Tv,
    emoji: '🎌',
    gradient: 'from-violet-500/20 to-coral-500/10',
    borderActive: 'border-violet-400/60',
    textActive: 'text-violet-300',
  },
  {
    id: 'games',
    label: 'Видеоигры',
    description: 'Genshin, Valorant, Minecraft...',
    icon: Gamepad2,
    emoji: '🎮',
    gradient: 'from-sage-500/20 to-amber-500/10',
    borderActive: 'border-sage-400/60',
    textActive: 'text-sage-300',
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const user = getUser()

  const [saving, setSaving] = useState(false)

  async function handleContinue() {
    if (step === 0) {
      setStep(1)
      return
    }
    if (selected) {
      const backendInterest = selected === 'games' ? 'videogames' : 'anime'
      localStorage.setItem('chemprep_interest', selected)

      // Save interest to backend
      setSaving(true)
      try {
        const res = await api.updateInterest(backendInterest as 'anime' | 'videogames')
        const token = getToken()
        if (token) setAuth(token, res.user)
      } catch {
        // Non-critical — continue even if save fails
      } finally {
        setSaving(false)
      }

      setOnboarded()
      navigate('/diagnostic')
    }
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10 page-enter">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 rounded-full transition-all duration-500',
              i <= step ? 'w-8 bg-amber-400' : 'w-2 bg-ink-700'
            )}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400/20 to-amber-500/5 border border-amber-400/20 flex items-center justify-center mb-8">
            <Sparkles size={36} className="text-amber-400" />
          </div>

          <h1 className="font-display text-3xl font-bold text-ink-50 mb-3">
            Привет, {user?.name || 'друг'}!
          </h1>
          <p className="text-ink-400 text-base leading-relaxed max-w-[280px] mb-4">
            Добро пожаловать в ChemPrep. Мы поможем тебе подготовиться к ЕНТ по химии и получить грант.
          </p>

          <div className="mt-4 space-y-3 w-full max-w-[300px] text-left">
            {[
              { num: '01', text: 'Расскажи немного о себе' },
              { num: '02', text: 'Пройди диагностический тест' },
              { num: '03', text: 'Получи персональный план' },
            ].map((item) => (
              <div key={item.num} className="flex items-center gap-3 py-2">
                <span className="text-xs font-mono text-amber-400/60 w-6">{item.num}</span>
                <span className="text-ink-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col fade-in">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-ink-50 mb-2">Что тебе ближе?</h2>
            <p className="text-ink-400 text-sm">Мы подстроим стиль подачи под тебя</p>
          </div>

          <div className="space-y-4">
            {interests.map((interest) => {
              const isSelected = selected === interest.id
              return (
                <button
                  key={interest.id}
                  onClick={() => setSelected(interest.id)}
                  className={cn(
                    'w-full p-5 rounded-2xl border-2 text-left transition-all duration-300',
                    'bg-gradient-to-br',
                    interest.gradient,
                    isSelected
                      ? `${interest.borderActive} scale-[1.02] shadow-lg`
                      : 'border-ink-700/40 hover:border-ink-600/60'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                      isSelected ? 'bg-ink-800/50' : 'bg-ink-800/30'
                    )}>
                      {interest.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={cn(
                          'font-semibold text-lg transition-colors',
                          isSelected ? interest.textActive : 'text-ink-200'
                        )}>
                          {interest.label}
                        </h3>
                        {isSelected && (
                          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center', interest.borderActive.replace('border', 'bg').replace('/60', '/30'))}>
                            <div className="w-2.5 h-2.5 rounded-full bg-current" style={{ color: isSelected ? undefined : 'transparent' }} />
                          </div>
                        )}
                      </div>
                      <p className="text-ink-400 text-sm mt-1">{interest.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom button */}
      <div className="mt-8">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={(step === 1 && !selected) || saving}
          loading={saving}
          className="flex items-center justify-center gap-2"
        >
          {step === 0 ? 'Поехали' : 'Продолжить'}
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  )
}
