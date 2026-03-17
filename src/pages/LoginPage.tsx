import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { setAuth } from '@/lib/auth'
import { Button } from '@/components/Button'
import { FlaskConical, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login({ email, password })
      setAuth(res.token, res.user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between px-6 py-10 page-enter">
      {/* Top decorative element */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-amber-400/5 to-transparent pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-400/20">
            <FlaskConical size={32} className="text-ink-950" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-50 tracking-tight">ChemPrep</h1>
          <p className="text-ink-400 text-sm mt-1">Подготовка к ЕНТ по химии</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              required
              className="w-full bg-ink-800/60 border border-ink-700/50 rounded-xl px-4 py-3.5 text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-1.5 block">Пароль</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-ink-800/60 border border-ink-700/50 rounded-xl px-4 py-3.5 text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-coral-500/10 border border-coral-500/20 rounded-xl px-4 py-3 text-coral-400 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="mt-6">
            Войти
          </Button>
        </form>
      </div>

      {/* Bottom link */}
      <div className="text-center mt-8">
        <p className="text-ink-500 text-sm">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-amber-400 font-medium hover:text-amber-300 transition-colors">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
