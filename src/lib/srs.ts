export interface SRSCard {
  id: string
  questionText: string
  correctAnswer: string
  explanation?: string
  topicId: number
  // SM-2 fields
  interval: number      // days until next review
  repetitions: number   // consecutive correct recalls
  easeFactor: number    // difficulty (min 1.3)
  nextReviewDate: string // ISO date string
}

const SRS_KEY = 'chemprep_srs_cards'

export function getAllCards(): SRSCard[] {
  try {
    const raw = localStorage.getItem(SRS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAllCards(cards: SRSCard[]) {
  localStorage.setItem(SRS_KEY, JSON.stringify(cards))
}

export function getDueCards(): SRSCard[] {
  const today = new Date().toISOString().slice(0, 10)
  return getAllCards().filter((c) => c.nextReviewDate <= today)
}

export function getDueCount(): number {
  return getDueCards().length
}

/**
 * SM-2 algorithm update.
 * quality: 0-5 where <3 means failure, >=3 means success
 */
export function sm2Update(card: SRSCard, quality: number): SRSCard {
  let { interval, repetitions, easeFactor } = card
  quality = Math.max(0, Math.min(5, quality))

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  } else {
    // Incorrect response — reset
    repetitions = 0
    interval = 1
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  easeFactor = Math.max(1.3, easeFactor)

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + interval)

  return {
    ...card,
    interval,
    repetitions,
    easeFactor,
    nextReviewDate: nextDate.toISOString().slice(0, 10),
  }
}

/**
 * Add cards from wrong quiz answers. Deduplicates by questionText.
 */
export function addCardsFromQuizResult(
  answers: { questionText: string; correctAnswer: unknown; isCorrect: boolean; explanation?: string }[],
  topicId: number,
): number {
  const cards = getAllCards()
  const existingTexts = new Set(cards.map((c) => c.questionText))
  let added = 0

  for (const answer of answers) {
    if (answer.isCorrect) continue
    if (existingTexts.has(answer.questionText)) continue

    const today = new Date().toISOString().slice(0, 10)
    cards.push({
      id: `srs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      questionText: answer.questionText,
      correctAnswer: String(answer.correctAnswer),
      explanation: answer.explanation,
      topicId,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
    })
    existingTexts.add(answer.questionText)
    added++
  }

  saveAllCards(cards)
  return added
}

export function updateCardAfterReview(cardId: string, quality: number): SRSCard | null {
  const cards = getAllCards()
  const idx = cards.findIndex((c) => c.id === cardId)
  if (idx === -1) return null

  cards[idx] = sm2Update(cards[idx], quality)
  saveAllCards(cards)
  return cards[idx]
}

export function deleteCard(cardId: string) {
  const cards = getAllCards().filter((c) => c.id !== cardId)
  saveAllCards(cards)
}
