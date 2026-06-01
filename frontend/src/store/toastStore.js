import { create } from 'zustand'

const useToastStore = create((set) => ({
  toasts: [],
  show: (message, type = 'success') => {
    const id = Date.now() + Math.random()
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 3200)
    return id
  },
  hide: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}))

export default useToastStore
