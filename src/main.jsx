import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CommandCenter from './CommandCenter.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'

const isCommand = window.location.pathname === '/command'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isCommand ? <CommandCenter /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>,
)
