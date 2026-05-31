import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set) => ({
      isDark: true,
      toggleTheme: () =>
        set((state) => {
          const next = !state.isDark
          document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
          return { isDark: next }
        }),
    }),
    {
      name: 'workflow-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute(
            'data-theme',
            state.isDark ? 'dark' : 'light'
          )
        }
      },
    }
  )
)

export default useThemeStore
