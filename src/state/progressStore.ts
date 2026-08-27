import { createPersistentStore, useStore } from './createStore'

/**
 * What the student has done.
 *
 * The previous version declared `quizScores` and `completedChallenges` and then
 * never wrote to either — the Progress page reported a percentage built from two
 * arrays and called it "interactive artifacts completed", with no notion of how
 * long anyone had studied or whether they had answered anything correctly. These
 * fields now have mutators, and the derived selectors at the bottom are what the
 * analytics page reads, so a number on screen always traces back to a real event.
 */

export interface QuizRecord {
  /** Questions answered, counting repeats. */
  attempts: number
  /** Of those, how many were right first time. */
  correctFirstTry: number
  /** Question ids answered correctly at least once. */
  masteredQuestionIds: string[]
  /** ISO timestamp of the most recent answer. */
  lastAttemptAt: string
}

export interface ProgressState {
  viewedConcepts: string[]
  completedSimulations: string[]
  completedExperiments: string[]
  completedChallenges: string[]
  /** Keyed by simulation id. */
  quizScores: Record<string, QuizRecord>
  favorites: string[]
  recentlyViewed: string[]
  /** Seconds of active study per local calendar day, keyed `YYYY-MM-DD`. */
  activityByDay: Record<string, number>
  /** Seconds spent per simulation. */
  timeBySimulation: Record<string, number>
}

const defaults: ProgressState = {
  viewedConcepts: [],
  completedSimulations: [],
  completedExperiments: [],
  completedChallenges: [],
  quizScores: {},
  favorites: [],
  recentlyViewed: [],
  activityByDay: {},
  timeBySimulation: {}
}

/** `YYYY-MM-DD` in the student's own timezone — a streak is a local-calendar idea. */
export function dayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.filter((item): item is string => typeof item === 'string')
}

function asNumberMap(value: unknown): Record<string, number> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
  const out: Record<string, number> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'number' && Number.isFinite(raw)) out[key] = raw
  }
  return out
}

/**
 * v1 stored `quizScores` as a plain `Record<string, number>`. It was never
 * written to, but a hand-edited or future payload might contain one, so a bare
 * number is read as that many correct answers rather than discarded.
 */
function migrate(raw: unknown): Partial<ProgressState> {
  if (raw === null || typeof raw !== 'object') return {}
  const source = raw as Record<string, unknown>
  const out: Partial<ProgressState> = {}

  const arrays: Array<keyof ProgressState> = [
    'viewedConcepts',
    'completedSimulations',
    'completedExperiments',
    'completedChallenges',
    'favorites',
    'recentlyViewed'
  ]
  for (const field of arrays) {
    const value = asStringArray(source[field])
    if (value) (out as Record<string, unknown>)[field] = value
  }

  const activity = asNumberMap(source.activityByDay)
  if (activity) out.activityByDay = activity
  const perSim = asNumberMap(source.timeBySimulation)
  if (perSim) out.timeBySimulation = perSim

  const scores = source.quizScores
  if (scores !== null && typeof scores === 'object' && !Array.isArray(scores)) {
    const migrated: Record<string, QuizRecord> = {}
    for (const [id, value] of Object.entries(scores as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        migrated[id] = {
          attempts: Math.max(0, Math.round(value)),
          correctFirstTry: Math.max(0, Math.round(value)),
          masteredQuestionIds: [],
          lastAttemptAt: ''
        }
      } else if (value !== null && typeof value === 'object') {
        const record = value as Record<string, unknown>
        migrated[id] = {
          attempts: typeof record.attempts === 'number' ? record.attempts : 0,
          correctFirstTry: typeof record.correctFirstTry === 'number' ? record.correctFirstTry : 0,
          masteredQuestionIds: asStringArray(record.masteredQuestionIds) ?? [],
          lastAttemptAt: typeof record.lastAttemptAt === 'string' ? record.lastAttemptAt : ''
        }
      }
    }
    out.quizScores = migrated
  }

  return out
}

const store = createPersistentStore<ProgressState>({
  key: 'science3d.progress.v2',
  defaults,
  migrate,
  legacyKeys: ['science3d.progress.v1']
})

const addOnce = (list: string[], id: string) => (list.includes(id) ? list : [...list, id])

export const progressStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,

  markViewed(id: string) {
    store.set((current) => ({
      ...current,
      viewedConcepts: addOnce(current.viewedConcepts, id),
      recentlyViewed: [id, ...current.recentlyViewed.filter((item) => item !== id)].slice(0, 10)
    }))
  },

  toggleFavorite(id: string) {
    store.set((current) => ({
      ...current,
      favorites: current.favorites.includes(id)
        ? current.favorites.filter((item) => item !== id)
        : [...current.favorites, id]
    }))
  },

  markSimulationComplete(id: string) {
    store.set((current) =>
      current.completedSimulations.includes(id)
        ? current
        : { ...current, completedSimulations: [...current.completedSimulations, id] }
    )
  },

  markExperimentComplete(id: string) {
    store.set((current) =>
      current.completedExperiments.includes(id)
        ? current
        : { ...current, completedExperiments: [...current.completedExperiments, id] }
    )
  },

  markChallengeComplete(id: string) {
    store.set((current) =>
      current.completedChallenges.includes(id)
        ? current
        : { ...current, completedChallenges: [...current.completedChallenges, id] }
    )
  },

  /**
   * Records one answer. `firstTry` distinguishes "got it" from "got it after three
   * guesses", which is the difference between mastery and elimination.
   */
  recordQuizAnswer(simulationId: string, questionId: string, correct: boolean, firstTry: boolean) {
    store.set((current) => {
      const existing: QuizRecord =
        current.quizScores[simulationId] ?? {
          attempts: 0,
          correctFirstTry: 0,
          masteredQuestionIds: [],
          lastAttemptAt: ''
        }
      return {
        ...current,
        quizScores: {
          ...current.quizScores,
          [simulationId]: {
            attempts: existing.attempts + 1,
            correctFirstTry: existing.correctFirstTry + (correct && firstTry ? 1 : 0),
            masteredQuestionIds: correct
              ? addOnce(existing.masteredQuestionIds, questionId)
              : existing.masteredQuestionIds,
            lastAttemptAt: new Date().toISOString()
          }
        }
      }
    })
  },

  /** Adds engaged time. Called in bounded increments while a simulation is visible. */
  addStudyTime(simulationId: string, seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return
    // Cap a single contribution so a wedged timer cannot report a 40-hour session.
    const capped = Math.min(seconds, 600)
    const key = dayKey()
    store.set((current) => ({
      ...current,
      activityByDay: { ...current.activityByDay, [key]: (current.activityByDay[key] ?? 0) + capped },
      timeBySimulation: {
        ...current.timeBySimulation,
        [simulationId]: (current.timeBySimulation[simulationId] ?? 0) + capped
      }
    }))
  },

  reset() {
    store.reset()
  }
}

export function useProgressStore(): ProgressState {
  return useStore(store)
}

/* ── Derived values ────────────────────────────────────────────────────────── */

/** Total seconds studied, all time. */
export function totalStudySeconds(state: ProgressState): number {
  return Object.values(state.activityByDay).reduce((sum, value) => sum + value, 0)
}

/**
 * Consecutive days of study ending today or yesterday. Ending *yesterday* still
 * counts, so a streak is not destroyed by opening the app at 11 p.m. one day and
 * 1 a.m. two days later.
 */
export function studyStreak(state: ProgressState, today = new Date()): number {
  const active = (date: Date) => (state.activityByDay[dayKey(date)] ?? 0) > 0

  const cursor = new Date(today)
  if (!active(cursor)) {
    cursor.setDate(cursor.getDate() - 1)
    if (!active(cursor)) return 0
  }

  let streak = 0
  while (active(cursor)) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Fraction of first-try answers that were correct, or `null` if none attempted. */
export function quizAccuracy(state: ProgressState, simulationId: string): number | null {
  const record = state.quizScores[simulationId]
  if (!record || record.attempts === 0) return null
  return record.correctFirstTry / record.attempts
}

/** Every question mastered across every simulation. */
export function totalQuestionsMastered(state: ProgressState): number {
  return Object.values(state.quizScores).reduce((sum, record) => sum + record.masteredQuestionIds.length, 0)
}

/** Ids the student has finished, whether simulation, experiment or challenge. */
export function completedIds(state: ProgressState): string[] {
  return [
    ...new Set([...state.completedSimulations, ...state.completedExperiments, ...state.completedChallenges])
  ]
}
