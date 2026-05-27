export function toast(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('phx-toast', { detail: { message, type, id: Date.now() + Math.random() } }))
}
