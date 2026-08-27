type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export function toast(message: string) {
  listeners.forEach((fn) => fn(message));
}

export function subscribeToast(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
