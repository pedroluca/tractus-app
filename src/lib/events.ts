import type { FreezeWarning } from '@/data/streak'

// Eventos globais que a camada de dados dispara e a UI raiz escuta
// (no web isso era feito com window.dispatchEvent)
type AppEvents = {
  freezeWarning: FreezeWarning
}

type Listener<T> = (payload: T) => void

const listeners: { [K in keyof AppEvents]?: Set<Listener<AppEvents[K]>> } = {}

export function emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]) {
  listeners[event]?.forEach(listener => listener(payload))
}

export function subscribe<K extends keyof AppEvents>(event: K, listener: Listener<AppEvents[K]>) {
  const set = (listeners[event] ??= new Set()) as Set<Listener<AppEvents[K]>>
  set.add(listener)
  return () => {
    set.delete(listener)
  }
}
