import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AUDIT_WRITE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-write`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function auditWrite(action, table, record_id, payload) {
  try {
    const res = await fetch(AUDIT_WRITE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ action, table, record_id, payload }),
    })
    return res.json()
  } catch (err) {
    return { data: null, error: err?.message ?? 'Network error' }
  }
}

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
      const result = await auditWrite('insert', tableName, undefined, values)
      const { data, error: err } = result
      if (err || !data) return { data: null, error: err ?? 'Insert returned no data' }
      setRows((prev) => (prev.some((r) => r.id === data.id) ? prev : [...prev, data]))
      return { data, error: null }
    },
    [tableName],
  )

  const update = useCallback(
    async (id, values) => {
      const result = await auditWrite('update', tableName, id, values)
      const { data, error: err } = result
      if (err || !data) return { data: null, error: err ?? 'Update returned no data' }
      setRows((prev) => prev.map((r) => (r.id === id ? data : r)))
      return { data, error: null }
    },
    [tableName],
  )

  const remove = useCallback(
    async (id) => {
      const result = await auditWrite('delete', tableName, id, undefined)
      const { error: err } = result
      if (!err) setRows((prev) => prev.filter((r) => r.id !== id))
      return { error: err }
    },
    [tableName],
  )

  const refetch = useCallback(() => {
    supabase
      .from(tableName)
      .select('*')
      .order(orderBy, { ascending })
      .then(({ data }) => { if (data) setRows(data) })
  }, [tableName, orderBy, ascending])

  return { rows, loading, error, insert, update, remove, setRows, refetch }
}
