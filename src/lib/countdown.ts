const EXAM_DATE_KEY = 'chemprep_exam_date'

function getDefaultExamDate(): string {
  const year = new Date().getFullYear()
  const june15 = new Date(year, 5, 15) // June 15
  // If June 15 has passed, default to next year
  if (june15 < new Date()) {
    return `${year + 1}-06-15`
  }
  return `${year}-06-15`
}

export function getExamDate(): string {
  return localStorage.getItem(EXAM_DATE_KEY) || getDefaultExamDate()
}

export function setExamDate(date: string) {
  localStorage.setItem(EXAM_DATE_KEY, date)
}

export type Urgency = 'safe' | 'warning' | 'critical'

export interface CountdownInfo {
  days: number
  hours: number
  urgency: Urgency
  isPast: boolean
}

export function getCountdown(): CountdownInfo {
  const examDate = new Date(getExamDate() + 'T00:00:00')
  const now = new Date()
  const diffMs = examDate.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { days: 0, hours: 0, urgency: 'critical', isPast: true }
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  let urgency: Urgency = 'safe'
  if (days < 30) urgency = 'critical'
  else if (days < 60) urgency = 'warning'

  return { days, hours, urgency, isPast: false }
}
