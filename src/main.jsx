import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import AdminDashboard from './AdminDashboard.jsx'
import AdminPanel from './AdminPanel.jsx'
import App from './App.jsx'
import CommandCenter from './CommandCenter.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import Toaster from './Toaster.jsx'
import './index.css'

function AdminLogin() {
  const params = new URLSearchParams(window.location.search)
  const next = params.get('next') || '/admin'
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: val }),
      })
      if (res.ok) {
        window.location.href = next
      } else {
        setErr(true)
        setVal('')
      }
    } catch {
      setErr(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#100805]">
      <div className="w-full max-w-sm rounded border border-[#3C1810] bg-[#1C0C08] p-8">
        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#BA1323]">Phoenix Operation</div>
        <div className="mb-6 text-2xl font-black uppercase tracking-[0.08em] text-[#FAF0E8]">Admin Access</div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="password"
            autoFocus
            className="w-full rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] placeholder-[#5C3820] focus:border-[#BA1323] focus:outline-none"
            placeholder="Password"
            value={val}
            onChange={e => { setVal(e.target.value); setErr(false) }}
          />
          {err && <div className="text-[11px] font-bold text-[#E83025]">Incorrect password</div>}
          <button
            type="submit"
            disabled={loading || !val}
            className="rounded bg-[#BA1323] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#140a06] hover:bg-[#D4152A] transition-colors disabled:opacity-40"
          >
            {loading ? 'Verifying…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {path === '/command' ? <CommandCenter />
        : path === '/admin'   ? <AdminDashboard />
        : path === '/post'    ? <AdminPanel />
        : path === '/login'   ? <AdminLogin />
        : <App />}
      <Toaster />
    </ErrorBoundary>
  </React.StrictMode>,
)
