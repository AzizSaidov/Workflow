import { create } from 'zustand'

const useSiteStore = create((set) => ({
  holidayMode: false,
  setHolidayMode: (val) => set({ holidayMode: val }),
}))

export default useSiteStore
