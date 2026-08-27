import { useSyncExternalStore } from 'react'

/**
 * A tiny persisted store.
 *
 * Progress and settings both need the same four things — a React-subscribable
 * snapshot, `localStorage` durability, tolerance of corrupt or older payloads, and
 * cross-tab sync — so they share one implementation rather than each hand-rolling
 * it. The original progress store did the first two and neither of the last two: a
 * malformed `localStorage` entry silently reset everything, and a second tab's
 * changes were invisible until reload.
 */

export interface PersistentStore<T> {
  subscribe(listener: () => void): () => void
  getSnapshot(): T
  /** Replace the state. The updater must return a new object, not mutate. */
  set(updater: (current: T) => T): void
  /** Back to the defaults, clearing storage. */
  reset(): void
}

export interface PersistentStoreOptions<T> {
  /** `localStorage` key. Include a version suffix. */
  key: string
  defaults: T
  /**
   * Turn a persisted payload of unknown shape into a partial state. Return `{}`
   * to discard it. Runs for both the current key and any `legacyKeys`.
   */
  migrate?: (raw: unknown) => Partial<T>
  /** Older keys to read from once, then upgrade away from. */
  legacyKeys?: readonly string[]
}

const hasWindow = typeof window !== 'undefined'

function parse(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function createPersistentStore<T extends object>(
  options: PersistentStoreOptions<T>
): PersistentStore<T> {
  const { key, defaults, migrate, legacyKeys = [] } = options
  const listeners = new Set<() => void>()

  const coerce = (raw: unknown): Partial<T> => {
    if (raw === null || typeof raw !== 'object') return {}
    if (migrate) return migrate(raw)
    return raw as Partial<T>
  }

  const load = (): T => {
    if (!hasWindow) return defaults
    try {
      const current = coerce(parse(window.localStorage.getItem(key)))
      if (Object.keys(current).length > 0) return { ...defaults, ...current }

      // Nothing under the current key: try to carry an older version forward
      // rather than silently starting a returning student from zero.
      for (const legacy of legacyKeys) {
        const older = coerce(parse(window.localStorage.getItem(legacy)))
        if (Object.keys(older).length > 0) {
          const upgraded = { ...defaults, ...older }
          try {
            window.localStorage.setItem(key, JSON.stringify(upgraded))
          } catch {
            /* storage full or blocked — the in-memory value is still correct */
          }
          return upgraded
        }
      }
      return defaults
    } catch {
      return defaults
    }
  }

  let state = load()

  const notify = () => {
    for (const listener of listeners) listener()
  }

  const persist = () => {
    if (!hasWindow) return
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Private-browsing quota errors must not take the app down; the session
      // keeps working, it just will not survive a reload.
    }
  }

  if (hasWindow) {
    // Another tab wrote to our key. Adopt it so two open tabs agree.
    window.addEventListener('storage', (event) => {
      if (event.key !== key) return
      const incoming = coerce(parse(event.newValue))
      state = { ...defaults, ...incoming }
      notify()
    })
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot() {
      return state
    },
    set(updater) {
      const next = updater(state)
      if (next === state) return
      state = next
      persist()
      notify()
    },
    reset() {
      state = defaults
      if (hasWindow) {
        try {
          window.localStorage.removeItem(key)
        } catch {
          /* ignore */
        }
      }
      notify()
    }
  }
}

/** Subscribe a component to a store. */
export function useStore<T extends object>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
