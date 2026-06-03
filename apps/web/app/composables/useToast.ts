/**
 * Lightweight, dependency-free toast queue. Components subscribe by calling
 * `useToast()` and rendering `messages` somewhere in the layout.
 *
 * Auto-dismiss after `ttl` ms; `action` buttons are rendered if provided.
 */
export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: number
  title: string
  body?: string
  /** 'info' | 'success' | 'error' | 'lead' | 'booking' */
  kind?: 'info' | 'success' | 'error' | 'lead' | 'booking'
  href?: string
  action?: ToastAction
  ttl?: number
}

const state = ref<Toast[]>([])
let counter = 0
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function dismiss(id: number) {
  const idx = state.value.findIndex((t) => t.id === id)
  if (idx >= 0) state.value.splice(idx, 1)
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

function push(t: Omit<Toast, 'id'>) {
  const id = ++counter
  const toast: Toast = { id, ttl: 5000, kind: 'info', ...t }
  state.value.push(toast)
  if (toast.ttl && toast.ttl > 0) {
    timers.set(id, setTimeout(() => dismiss(id), toast.ttl))
  }
  return id
}

export function useToast() {
  return {
    messages: state,
    push,
    dismiss,
  }
}
