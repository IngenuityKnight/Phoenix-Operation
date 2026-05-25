import { useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useNotifications() {
  useEffect(() => {
    if (!('Notification' in window)) return

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    function notify(title, body) {
      if (Notification.permission !== 'granted') return
      try { new Notification(title, { body, icon: '/favicon.ico', silent: false }) } catch {}
    }

    const channel = supabase
      .channel('notif-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ops_feed' }, ({ new: entry }) => {
        if (entry.category === 'ALERT') {
          notify('ALERT — Freakman Ops', entry.message)
        }
        // Non-alert messages are intentionally skipped to avoid noise
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'arrivals' }, ({ new: arrival, old }) => {
        if (arrival.status === old.status) return
        if (arrival.status === 'En Route')  notify(`${arrival.name} is en route`, 'On the way to the house')
        if (arrival.status === 'Landed')    notify(`${arrival.name} landed`, arrival.flight_number || 'Touchdown')
        if (arrival.status === 'Arrived')   notify(`${arrival.name} is at the house`, 'The crew grows')
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])
}
