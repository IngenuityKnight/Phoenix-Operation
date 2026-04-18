import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'

export function usePersistedTripState(key, initialValue) {
  // Initialise synchronously from localStorage so the UI renders immediately.
  const [state, setStateInternal] = useState(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const raw = window.localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw)
    } catch {}
    return initialValue
  })

  // Tracks whether the initial Supabase fetch is complete.
  // We gate outbound writes on this so we never overwrite a fresh Supabase
  // record with stale localStorage data during the startup hydration window.
  const ready = useRef(false)

  // On mount: pull the latest state from Supabase and hydrate.
  useEffect(() => {
    supabase
      .from('trip_state')
      .select('data')
      .eq('key', key)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.data) {
          setStateInternal(data.data)
          try {
            window.localStorage.setItem(key, JSON.stringify(data.data))
          } catch {}
        }
      })
      .catch(() => {
        // Supabase unreachable — localStorage data is already loaded, carry on.
      })
      .finally(() => {
        ready.current = true
      })
  }, [key])

  // Wrap setState so every caller automatically syncs to both stores.
  const setState = useCallback(
    (value) => {
      setStateInternal((prev) => {
        const next = typeof value === 'function' ? value(prev) : value

        // Write to localStorage (synchronous fallback).
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {}

        // Write to Supabase (fire and forget, only after hydration).
        if (ready.current) {
          supabase
            .from('trip_state')
            .upsert({ key, data: next, updated_at: new Date().toISOString() })
            .then(({ error }) => {
              if (error) console.warn('[supabase] sync failed:', error.message)
            })
        }

        return next
      })
    },
    [key],
  )

  return [state, setState]
}
