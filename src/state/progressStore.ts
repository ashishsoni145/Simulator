import { useSyncExternalStore } from 'react'

export interface ProgressState {
  viewedConcepts: string[]
  completedSimulations: string[]
  completedExperiments: string[]
  completedChallenges: string[]
  quizScores: Record<string, number>
  favorites: string[]
  recentlyViewed: string[]
}

const storageKey = 'science3d.progress.v1'

const defaultState: ProgressState = {
  viewedConcepts: [],
  completedSimulations: [],
  completedExperiments: [],
  completedChallenges: [],
  quizScores: {},
  favorites: [],
  recentlyViewed: []
}

const listeners = new Set<() => void>()
let cachedState = readState()

function readState(): ProgressState {
  if (typeof window === 'undefined') return defaultState
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState
  } catch {
    return defaultState
  }
}

function writeState(next: ProgressState) {
  cachedState = next
  window.localStorage.setItem(storageKey, JSON.stringify(next))
  listeners.forEach((listener) => listener())
}

export const progressStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() {
    return cachedState
  },
  markViewed(id: string) {
    const recentlyViewed = [id, ...cachedState.recentlyViewed.filter((item) => item !== id)].slice(0, 10)
    const viewedConcepts = cachedState.viewedConcepts.includes(id)
      ? cachedState.viewedConcepts
      : [...cachedState.viewedConcepts, id]
    writeState({ ...cachedState, viewedConcepts, recentlyViewed })
  },
  toggleFavorite(id: string) {
    const exists = cachedState.favorites.includes(id)
    writeState({
      ...cachedState,
      favorites: exists ? cachedState.favorites.filter((item) => item !== id) : [...cachedState.favorites, id]
    })
  },
  markSimulationComplete(id: string) {
    if (cachedState.completedSimulations.includes(id)) return
    writeState({ ...cachedState, completedSimulations: [...cachedState.completedSimulations, id] })
  },
  markExperimentComplete(id: string) {
    if (cachedState.completedExperiments.includes(id)) return
    writeState({ ...cachedState, completedExperiments: [...cachedState.completedExperiments, id] })
  }
}

export function useProgressStore() {
  return useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot, progressStore.getSnapshot)
}
