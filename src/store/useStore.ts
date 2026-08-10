import { create } from 'zustand'

export type DateRangeOption = 
  | 'TODAY' 
  | 'YESTERDAY' 
  | 'LAST_7_DAYS' 
  | 'LAST_30_DAYS' 
  | 'THIS_MONTH' 
  | 'LAST_MONTH' 
  | 'THIS_QUARTER' 
  | 'THIS_YEAR' 
  | 'CUSTOM'

export interface DateRange {
  start: Date
  end: Date
}

interface AppState {
  selectedBrandId: string | null
  setSelectedBrandId: (id: string | null) => void
  
  dateRangeOption: DateRangeOption
  setDateRangeOption: (option: DateRangeOption) => void
  
  dateRange: DateRange
  setDateRange: (range: DateRange) => void

  selectedMarketplace: string | 'ALL'
  setSelectedMarketplace: (marketplace: string) => void

  selectedAdChannel: string | 'ALL'
  setSelectedAdChannel: (channel: string) => void
}

// Default date range: Last 30 days
const defaultEnd = new Date()
const defaultStart = new Date()
defaultStart.setDate(defaultStart.getDate() - 30)

export const useStore = create<AppState>((set) => ({
  selectedBrandId: null,
  setSelectedBrandId: (id) => set({ selectedBrandId: id }),
  
  dateRangeOption: 'LAST_30_DAYS',
  setDateRangeOption: (option) => set({ dateRangeOption: option }),
  
  dateRange: { start: defaultStart, end: defaultEnd },
  setDateRange: (range) => set({ dateRange: range }),

  selectedMarketplace: 'ALL',
  setSelectedMarketplace: (marketplace) => set({ selectedMarketplace: marketplace }),

  selectedAdChannel: 'ALL',
  setSelectedAdChannel: (channel) => set({ selectedAdChannel: channel }),
}))
