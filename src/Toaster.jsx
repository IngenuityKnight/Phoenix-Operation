import { useEffect, useState } from 'react'

const TYPE_STYLES = {
  success: { border: '#48B040', text: '#48B040', bg: '#48B040' },
  error:   { border: '#E83025', text: '#E83025', bg: '#E83025' },
  info:    { border: '#BA1323', text: '#BA1323', bg: '#BA1323' },
}

export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function onToast(e) {
      const t = e.detail
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3000)
    }
    window.addEventListener('phx-toast', onToast)
    return () => window.removeEventListener('phx-toast', onToast)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-40 right-4 z-[100] flex flex-col gap-2" style={{ pointerEvents: 'none' }}>
      {toasts.map(t => {
        const s = TYPE_STYLES[t.type] || TYPE_STYLES.info
        return (
          <div
            key={t.id}
            className="rounded px-4 py-2.5 text-[11px] font-black uppercase tracking-wider shadow-lg"
            style={{ background: `${s.bg}15`, border: `1px solid ${s.border}40`, color: s.text, backdropFilter: 'blur(8px)' }}
          >
            {t.message}
          </div>
        )
      })}
    </div>
  )
}
