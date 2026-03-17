const TOKEN_KEY = 'chemprep_token'
const USER_KEY = 'chemprep_user'
const ONBOARDING_KEY = 'chemprep_onboarding'
const DIAGNOSTIC_KEY = 'chemprep_diagnostic_done'

export interface User {
  id: number
  email: string
  name: string
  role: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function setOnboarded() {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

export function isDiagnosticDone(): boolean {
  return localStorage.getItem(DIAGNOSTIC_KEY) === 'true'
}

export function setDiagnosticDone() {
  localStorage.setItem(DIAGNOSTIC_KEY, 'true')
}
