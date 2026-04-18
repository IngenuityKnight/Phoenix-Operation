import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Generic CRUD hook for a Supabase table.
 * Loads rows on mount, subscribes to real-time changes, and exposes
 * insert / update / remove operations that optimistically update local state.
 *
 * @param {string} tableName  The Supabase table name.
 * @param {{ orderBy?: string, ascending?: boolean }} options
 */
export function useSupabaseTable(tableName, { orderBy = 'created_at', ascending = true } = {}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initial load
  useEffect(() => {
    setLoading(true)
    supabase
      .from(tableName)
      .select('*')
      .order(orderBy, { ascending })
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
        } else {
          setRows(data || [])
        }
        setLoading(false)
      })
  }, [tableName, orderBy, ascending])

  // Real-time subscription — requires Replication enabled for this table in Supabase dashboard
  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}-realtime`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: tableName }, (payload) => {
        setRows((prev) => {
          if (prev.some((r) => r.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: tableName }, (payload) => {
        setRows((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: tableName }, (payload) => {
        setRows((prev) => prev.filter((r) => r.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableName])

  const insert = useCallback(
    async (values) => {
      const { data, error: err } = await supabase
        .from(tableName)
        .insert(values)
        .select()
        .single()

      if (err) return { data: null, error: err }

      // Real-time will pick this up, but add optimistically in case of lag
      setRows((prev) => (prev.some((r) => r.id === data.id) ? prev : [...prev, data]))
      return { data, error: null }
    },
    [tableName],
  )

  const update = useCallback(
    async (id, values) => {
      const { data, error: err } = await supabase
        .from(tableName)
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (err) return { data: null, error: err }

      setRows((prev) => prev.map((r) => (r.id === id ? data : r)))
      return { data, error: null }
    },
    [tableName],
  )

  const remove = useCallback(
    async (id) => {
      const { error: err } = await supabase.from(tableName).delete().eq('id', id)
      if (!err) setRows((prev) => prev.filter((r) => r.id !== id))
      return { error: err }
    },
    [tableName],
  )

  return { rows, loading, error, insert, update, remove, setRows }
}
