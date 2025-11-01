/**
 * @store filterStore
 * @description Manages filter state shared between FilterScreen and ShowsScreen
 */

import { create } from 'zustand';

export interface ShowFilters {
  genres: string[];
  venues: string[];
  timeFilter: string; // 'all-day' | 'morning' | 'afternoon' | 'evening' | 'night'
  datePreset: string; // 'today' | 'tomorrow' | 'next-7' | 'next-30' | 'this-month' | 'next-month' | 'custom'
  dateFrom?: string; // ISO date string (YYYY-MM-DD)
  dateTo?: string; // ISO date string (YYYY-MM-DD)
}

interface FilterStore {
  // Current active filters
  activeFilters: ShowFilters;
  
  // Update filters
  setFilters: (filters: Partial<ShowFilters>) => void;
  
  // Clear all filters
  clearFilters: () => void;
  
  // Check if any filters are active
  hasActiveFilters: () => boolean;
}

const initialFilters: ShowFilters = {
  genres: [],
  venues: [],
  timeFilter: '',
  datePreset: '',
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  activeFilters: initialFilters,
  
  setFilters: (filters) => {
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        ...filters,
      },
    }));
  },
  
  clearFilters: () => {
    set({ activeFilters: initialFilters });
  },
  
  hasActiveFilters: () => {
    const { activeFilters } = get();
    // Defensive checks: timeFilter/datePreset may be undefined or empty string -> use Boolean
    return (
      (activeFilters.genres && activeFilters.genres.length > 0) ||
      (activeFilters.venues && activeFilters.venues.length > 0) ||
      Boolean(activeFilters.timeFilter) ||
      Boolean(activeFilters.datePreset) ||
      Boolean(activeFilters.dateFrom) ||
      Boolean(activeFilters.dateTo)
    );
  },
}));
