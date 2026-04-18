import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0f14] px-6 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F85149]">Panel Error</div>
          <div className="mt-3 max-w-sm text-sm text-[#8B949E]">
            Something crashed. Reload the page to recover.
          </div>
          <div className="mt-2 font-mono text-[10px] text-[#4B5563]">
            {this.state.error.message}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded border border-[#30363D] bg-[#161b22] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#58A6FF] hover:border-[#58A6FF]"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
