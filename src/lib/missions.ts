export interface MissionDefinition {
  id: string
  title: string
  description: string
  icon: string
  target: number
  reward: number
}

export interface MissionProgress {
  id: string
  current: number
  completed: boolean
  rewardClaimed: boolean
}

export interface MissionState extends MissionDefinition {
  current: number
  completed: boolean
  rewardClaimed: boolean
}

const MISSION_PROGRESS_KEY = 'chemprep_mission_progress'
const MISSION_DATE_KEY = 'chemprep_mission_date'

const MISSION_DEFINITIONS: MissionDefinition[] = [
  { id: 'solve_tests', title: 'Решить тесты', description: 'Пройди 2 теста по любой теме', icon: '📝', target: 2, reward: 15 },
  { id: 'review_topic', title: 'Повторить тему', description: 'Просмотри 1 презентацию', icon: '📖', target: 1, reward: 10 },
  { id: 'perfect_score', title: 'Отличный результат', description: 'Набери 80%+ на тесте', icon: '⭐', target: 1, reward: 20 },
]

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadProgress(): MissionProgress[] {
  try {
    const raw = localStorage.getItem(MISSION_PROGRESS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveProgress(progress: MissionProgress[]) {
  localStorage.setItem(MISSION_PROGRESS_KEY, JSON.stringify(progress))
}

export function getOrInitMissions(): MissionState[] {
  const savedDate = localStorage.getItem(MISSION_DATE_KEY)
  const today = getToday()

  // Reset on new day
  if (savedDate !== today) {
    localStorage.setItem(MISSION_DATE_KEY, today)
    const fresh: MissionProgress[] = MISSION_DEFINITIONS.map((d) => ({
      id: d.id,
      current: 0,
      completed: false,
      rewardClaimed: false,
    }))
    saveProgress(fresh)
    return MISSION_DEFINITIONS.map((def, i) => ({ ...def, ...fresh[i] }))
  }

  const progress = loadProgress()
  return MISSION_DEFINITIONS.map((def) => {
    const p = progress.find((x) => x.id === def.id) || {
      id: def.id, current: 0, completed: false, rewardClaimed: false,
    }
    return { ...def, ...p }
  })
}

/** Increment a mission counter. Returns the mission if it was newly completed, null otherwise. */
export function incrementMission(missionId: string): MissionState | null {
  const missions = getOrInitMissions()
  const mission = missions.find((m) => m.id === missionId)
  if (!mission || mission.completed) return null

  mission.current = Math.min(mission.current + 1, mission.target)
  const newlyCompleted = mission.current >= mission.target
  if (newlyCompleted) {
    mission.completed = true
  }

  saveProgress(missions.map(({ id, current, completed, rewardClaimed }) => ({
    id, current, completed, rewardClaimed,
  })))

  return newlyCompleted ? mission : null
}

/** Claim reward for a completed mission. Returns coins awarded, or 0 if already claimed. */
export function claimMissionReward(missionId: string): number {
  const missions = getOrInitMissions()
  const mission = missions.find((m) => m.id === missionId)
  if (!mission || !mission.completed || mission.rewardClaimed) return 0

  mission.rewardClaimed = true

  saveProgress(missions.map(({ id, current, completed, rewardClaimed }) => ({
    id, current, completed, rewardClaimed,
  })))

  return mission.reward
}
