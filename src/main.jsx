import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminDashboard from './AdminDashboard.jsx'
import AdminPanel from './AdminPanel.jsx'
import App from './App.jsx'
import CommandCenter from './CommandCenter.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'

const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {path === '/command' ? <CommandCenter />
        : path === '/admin' ? <AdminDashboard />
        : path === '/post'  ? <AdminPanel />
        : <App />}
    </ErrorBoundary>
  </React.StrictMode>,
)
