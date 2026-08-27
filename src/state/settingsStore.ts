import { createPersistentStore, useStore } from './createStore'

/**
 * User preferences.
 *
 * Kept apart from progress because the two have different lifetimes and different
 * reset semantics: a student clearing their progress should not lose their theme,
 * and clearing settings should not erase a month of study.
 *
 * The tutor key deserves a note. It is the student's own Anthropic key, typed in by
 * them, held in this browser's `localStorage` and sent only to Anthropic's API.
 * There is no key in the source, no proxy, and no server. The offline tutor is the
 * default and is fully functional without any of this — the key only ever upgrades
 * an already-working feature.
 */

export type ThemeChoice = 'dark' | 'light' | 'system'
export type MotionChoice = 'system' | 'reduce' | 'full'
export type TutorMode = 'offline' | 'api'

export interface SettingsState {
  theme: ThemeChoice
  motion: MotionChoice
  /** Show rulers, protractors and dimension lines by default in simulations. */
  showMeasurements: boolean
  /** Reveal second-order controls: air resistance, damping, restitution. */
  showAdvancedControls: boolean
  /** Significant figures for displayed quantities. */
  sigFigs: number
  /** Use the NCERT textbook's rounded constants (g = 9.8) instead of CODATA values. */
  textbookConstants: boolean
  tutorMode: TutorMode
  /** The student's own Anthropic API key. Never bundled, never transmitted anywhere else. */
  tutorApiKey: string
  tutorModel: string
}

const defaults: SettingsState = {
  theme: 'dark',
  motion: 'system',
  showMeasurements: true,
  showAdvancedControls: false,
  sigFigs: 4,
  textbookConstants: true,
  tutorMode: 'offline',
  tutorApiKey: '',
  tutorModel: 'claude-sonnet-5'
}

const THEMES: ThemeChoice[] = ['dark', 'light', 'system']
const MOTIONS: MotionChoice[] = ['system', 'reduce', 'full']
const MODES: TutorMode[] = ['offline', 'api']

function migrate(raw: unknown): Partial<SettingsState> {
  if (raw === null || typeof raw !== 'object') return {}
  const source = raw as Record<string, unknown>
  const out: Partial<SettingsState> = {}

  if (typeof source.theme === 'string' && THEMES.includes(source.theme as ThemeChoice)) {
    out.theme = source.theme as ThemeChoice
  }
  if (typeof source.motion === 'string' && MOTIONS.includes(source.motion as MotionChoice)) {
    out.motion = source.motion as MotionChoice
  }
  if (typeof source.tutorMode === 'string' && MODES.includes(source.tutorMode as TutorMode)) {
    out.tutorMode = source.tutorMode as TutorMode
  }
  if (typeof source.showMeasurements === 'boolean') out.showMeasurements = source.showMeasurements
  if (typeof source.showAdvancedControls === 'boolean') out.showAdvancedControls = source.showAdvancedControls
  if (typeof source.textbookConstants === 'boolean') out.textbookConstants = source.textbookConstants
  if (typeof source.sigFigs === 'number' && source.sigFigs >= 2 && source.sigFigs <= 6) {
    out.sigFigs = Math.round(source.sigFigs)
  }
  if (typeof source.tutorApiKey === 'string') out.tutorApiKey = source.tutorApiKey
  if (typeof source.tutorModel === 'string' && source.tutorModel.length > 0) out.tutorModel = source.tutorModel

  return out
}

const store = createPersistentStore<SettingsState>({
  key: 'science3d.settings.v1',
  defaults,
  migrate
})

export const settingsStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,

  set<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    store.set((current) => (current[key] === value ? current : { ...current, [key]: value }))
  },

  toggle(key: 'showMeasurements' | 'showAdvancedControls' | 'textbookConstants') {
    store.set((current) => ({ ...current, [key]: !current[key] }))
  },

  /** Removes the stored key. Offered next to the input, because it must be easy. */
  clearTutorKey() {
    store.set((current) => (current.tutorApiKey === '' ? current : { ...current, tutorApiKey: '', tutorMode: 'offline' }))
  },

  reset() {
    store.reset()
  }
}

export function useSettings(): SettingsState {
  return useStore(store)
}

/** Whether animations should be suppressed, combining the OS hint and the override. */
export function shouldReduceMotion(settings: SettingsState): boolean {
  if (settings.motion === 'reduce') return true
  if (settings.motion === 'full') return false
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** The theme actually in force once `system` is resolved. */
export function resolveTheme(settings: SettingsState): 'dark' | 'light' {
  if (settings.theme !== 'system') return settings.theme
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/**
 * Whether the API tutor is usable. Both a mode and a key are required, so
 * switching the toggle without pasting a key cannot break the tutor — it stays
 * offline and says so.
 */
export function tutorApiReady(settings: SettingsState): boolean {
  return settings.tutorMode === 'api' && settings.tutorApiKey.trim().length > 20
}
